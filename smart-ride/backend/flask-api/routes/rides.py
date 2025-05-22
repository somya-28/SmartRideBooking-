"""
Ride Management API routes.

This module provides API endpoints for ride requests, driver matching,
and real-time ride simulation.
"""

import os
import json
import time
import uuid
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from algorithms.city_graph import CityGraph, create_demo_city_graph
from algorithms.driver_matching import Driver, RideRequest, DriverMatcher
from algorithms.simulation import RideSimulator, RideStatus

# Create a Blueprint for the ride routes
rides_bp = Blueprint('rides', __name__)

# Initialize the city graph
graph_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'city_graph.json')

try:
    city_graph = CityGraph.load_from_file(graph_file)
    print(f"Loaded city graph from {graph_file}")
except FileNotFoundError:
    print(f"Creating new demo city graph")
    city_graph = create_demo_city_graph()
    os.makedirs(os.path.dirname(graph_file), exist_ok=True)
    city_graph.save_to_file(graph_file)

# Initialize the simulator
simulator = RideSimulator(city_graph)

# In-memory storage for active requests and rides
active_requests = {}  # request_id -> { request, matched_drivers }
active_rides = {}  # ride_id -> ride_details


@rides_bp.route('/city-graph', methods=['GET'])
@cross_origin()
def get_city_graph():
    """Get the city graph structure for visualization."""
    nodes = []
    for node_id, node in city_graph.nodes.items():
        nodes.append({
            'id': node_id,
            'lat': node.lat,
            'lng': node.lng,
            'name': node.name
        })
    
    edges = []
    for node_id, connections in city_graph.edges.items():
        for conn_id, edge_data in connections.items():
            edges.append({
                'from': node_id,
                'to': conn_id,
                'distance': edge_data['distance'],
                'time': edge_data['time']
            })
    
    return jsonify({
        'nodes': nodes,
        'edges': edges
    })


@rides_bp.route('/simulate-drivers', methods=['POST'])
@cross_origin()
def simulate_drivers():
    """Start the simulation and create demo drivers."""
    from ..algorithms.driver_matching import create_demo_drivers
    
    # Add demo drivers if not already added
    if not simulator.driver_matcher.drivers:
        demo_drivers = create_demo_drivers(city_graph)
        for driver in demo_drivers:
            simulator.add_driver(driver)
    
    # Start the simulation if not already running
    if not simulator.is_running:
        simulator.start_simulation()
    
    # Return available drivers
    available_drivers = []
    for driver in simulator.driver_matcher.get_available_drivers():
        available_drivers.append({
            'id': driver.id,
            'name': driver.name,
            'location': driver.current_location,
            'vehicle_type': driver.vehicle_type,
            'rating': driver.rating,
            'total_trips': driver.total_trips
        })
    
    return jsonify({
        'message': 'Simulation started with demo drivers',
        'available_drivers': available_drivers,
        'total_drivers': len(simulator.driver_matcher.drivers)
    })


@rides_bp.route('/request-ride', methods=['POST'])
@cross_origin()
def request_ride():
    """Request a ride with pickup and dropoff locations."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Get optional fields
    user_id = data.get('user_id', 'user-001')
    vehicle_type = data.get('vehicle_type', 'sedan')
    
    # Create a ride request
    request_obj = simulator.create_ride_request(
        pickup_lat=float(data['pickup_lat']),
        pickup_lng=float(data['pickup_lng']),
        dropoff_lat=float(data['dropoff_lat']),
        dropoff_lng=float(data['dropoff_lng']),
        vehicle_type=vehicle_type
    )
    
    # Find matching drivers
    match_result = simulator.request_ride(request_obj)
    
    # Store the request and matches
    active_requests[request_obj.id] = {
        'request': request_obj,
        'matched_drivers': match_result['matched_drivers']
    }
    
    # Prepare response
    drivers = []
    for driver in match_result['matched_drivers']:
        drivers.append({
            'id': driver['driver']['id'],
            'name': driver['driver']['name'],
            'rating': driver['driver']['rating'],
            'vehicle_type': driver['driver']['vehicle_type'],
            'trips': driver['driver']['total_trips'],
            'eta_minutes': driver['eta_minutes'],
            'distance': driver['direct_distance'],
            'fare': driver['estimated_fare'],
            'location': {
                'lat': driver['driver']['current_location'][0],
                'lng': driver['driver']['current_location'][1]
            }
        })
    
    return jsonify({
        'request_id': request_obj.id,
        'pickup': {
            'lat': request_obj.pickup_location[0],
            'lng': request_obj.pickup_location[1],
            'node_id': request_obj.pickup_node_id
        },
        'dropoff': {
            'lat': request_obj.dropoff_location[0],
            'lng': request_obj.dropoff_location[1],
            'node_id': request_obj.dropoff_node_id
        },
        'vehicle_type': vehicle_type,
        'matched_drivers': drivers,
        'timestamp': time.time()
    })


@rides_bp.route('/confirm-ride', methods=['POST'])
@cross_origin()
def confirm_ride():
    """Confirm a ride with a specific driver."""
    data = request.get_json()
    
    # Validate required fields
    if 'request_id' not in data or 'driver_id' not in data:
        return jsonify({'error': 'Missing request_id or driver_id'}), 400
    
    request_id = data['request_id']
    driver_id = data['driver_id']
    
    # Check if request exists
    if request_id not in active_requests:
        return jsonify({'error': 'Request not found'}), 404
    
    request_obj = active_requests[request_id]['request']
    
    # Confirm the ride
    confirm_result = simulator.confirm_ride(request_obj, driver_id)
    
    # Check for errors
    if 'error' in confirm_result:
        return jsonify(confirm_result), 400
    
    # Store the ride details
    ride_id = confirm_result['ride_id']
    active_rides[ride_id] = confirm_result
    
    # Prepare response
    return jsonify({
        'ride_id': ride_id,
        'status': confirm_result['status'],
        'driver': confirm_result['driver'],
        'pickup': {
            'lat': request_obj.pickup_location[0],
            'lng': request_obj.pickup_location[1],
            'node_id': request_obj.pickup_node_id
        },
        'dropoff': {
            'lat': request_obj.dropoff_location[0],
            'lng': request_obj.dropoff_location[1],
            'node_id': request_obj.dropoff_node_id
        },
        'estimated_pickup_time': confirm_result['estimated_pickup_time'],
        'estimated_fare': confirm_result['estimated_fare'],
        'pickup_path': confirm_result['pickup_path'],
        'dropoff_path': confirm_result['dropoff_path'],
        'timestamp': time.time()
    })


@rides_bp.route('/ride-status/<ride_id>', methods=['GET'])
@cross_origin()
def get_ride_status(ride_id):
    """Get the status of a ride."""
    # Check if ride exists
    if ride_id not in active_rides:
        return jsonify({'error': 'Ride not found'}), 404
    
    # Get ride status
    status_result = simulator.get_ride_status(ride_id)
    
    # Check for errors
    if 'error' in status_result:
        return jsonify(status_result), 400
    
    # Get the ride details
    ride_details = active_rides[ride_id]
    
    # Prepare response
    response = {
        'ride_id': ride_id,
        'status': status_result['status'],
        'driver': {
            'id': status_result['driver']['id'],
            'name': status_result['driver']['name'],
            'location': {
                'lat': status_result['driver']['current_location'][0],
                'lng': status_result['driver']['current_location'][1]
            }
        },
        'progress': status_result['progress'],
        'estimated_pickup_time': status_result['estimated_pickup_time'],
        'estimated_fare': status_result['estimated_fare'],
        'timestamp': time.time()
    }
    
    return jsonify(response)


@rides_bp.route('/start-ride/<ride_id>', methods=['POST'])
@cross_origin()
def start_ride(ride_id):
    """Start a ride after the driver has arrived at pickup."""
    # Start the ride
    result = simulator.start_ride(ride_id)
    
    # Check for errors
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result)


@rides_bp.route('/complete-ride/<ride_id>', methods=['POST'])
@cross_origin()
def complete_ride(ride_id):
    """Complete a ride (manually)."""
    # Complete the ride
    result = simulator.complete_ride(ride_id)
    
    # Check for errors
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result)


@rides_bp.route('/cancel-ride/<ride_id>', methods=['POST'])
@cross_origin()
def cancel_ride(ride_id):
    """Cancel a ride."""
    # Cancel the ride
    result = simulator.cancel_ride(ride_id)
    
    # Check for errors
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result)


@rides_bp.route('/simulation-state', methods=['GET'])
@cross_origin()
def get_simulation_state():
    """Get the current state of the simulation."""
    if not simulator.is_running:
        return jsonify({'error': 'Simulation is not running'}), 400
    
    # Get simulation state
    state = simulator.get_simulation_state()
    
    # Convert to format suitable for frontend
    active_rides_list = []
    for ride_id, ride_data in state['active_rides'].items():
        active_rides_list.append({
            'ride_id': ride_id,
            'status': ride_data['status'],
            'driver': {
                'id': ride_data['driver']['id'],
                'name': ride_data['driver']['name'],
                'location': {
                    'lat': ride_data['driver']['current_location'][0],
                    'lng': ride_data['driver']['current_location'][1]
                }
            },
            'pickup': {
                'lat': ride_data['pickup'][0],
                'lng': ride_data['pickup'][1]
            },
            'dropoff': {
                'lat': ride_data['dropoff'][0],
                'lng': ride_data['dropoff'][1]
            },
            'progress': ride_data['progress']
        })
    
    available_drivers_list = []
    for driver in state['available_drivers']:
        available_drivers_list.append({
            'id': driver['id'],
            'name': driver['name'],
            'location': {
                'lat': driver['location'][0],
                'lng': driver['location'][1]
            },
            'vehicle_type': driver['vehicle_type']
        })
    
    return jsonify({
        'timestamp': state['timestamp'],
        'active_rides': active_rides_list,
        'available_drivers': available_drivers_list
    })


@rides_bp.route('/toggle-simulation', methods=['POST'])
@cross_origin()
def toggle_simulation():
    """Start or stop the simulation."""
    data = request.get_json()
    action = data.get('action', 'start')
    
    if action == 'start':
        if not simulator.is_running:
            simulator.start_simulation()
            return jsonify({'message': 'Simulation started'})
        else:
            return jsonify({'message': 'Simulation already running'})
    elif action == 'stop':
        if simulator.is_running:
            simulator.stop_simulation()
            return jsonify({'message': 'Simulation stopped'})
        else:
            return jsonify({'message': 'Simulation not running'})
    else:
        return jsonify({'error': 'Invalid action, use "start" or "stop"'}), 400
