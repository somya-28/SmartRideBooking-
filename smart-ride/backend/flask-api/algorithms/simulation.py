"""
Real-Time Ride Simulation Module

This module provides functionality for simulating the movement of drivers and riders
in real-time on the city graph, allowing visualization and testing of the matching
and pathfinding algorithms.

Time Complexity Analysis:
- Simulation Step: O(D + R), where D is the number of active drivers and R is the number of active rides
  * Each driver movement calculation: O(1)
  * Each ride progress update: O(1)

Space Complexity:
- O(D + R + V), where D is the number of drivers, R is the number of rides, and V is the graph vertices
"""

import time
import math
import random
import threading
import json
from typing import Dict, List, Tuple, Set, Optional
from datetime import datetime

from .city_graph import CityGraph, CityNode, haversine_distance
from .pathfinding import find_optimal_path, reconstruct_path
from .driver_matching import Driver, RideRequest, DriverMatcher, DriverStatus


class RideStatus:
    """Enumeration of ride statuses."""
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    DRIVER_EN_ROUTE = "driver_en_route"
    ARRIVED = "arrived"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ActiveRide:
    """Class representing an active ride in the system."""
    
    def __init__(self, 
                 ride_id: str,
                 request: RideRequest,
                 driver: Driver,
                 driver_to_pickup_path: List[str],
                 pickup_to_dropoff_path: List[str],
                 estimated_pickup_time: float,
                 estimated_fare: float):
        """
        Initialize an active ride.
        
        Args:
            ride_id: Unique ride identifier
            request: The original ride request
            driver: The assigned driver
            driver_to_pickup_path: Path from driver to pickup
            pickup_to_dropoff_path: Path from pickup to dropoff
            estimated_pickup_time: Estimated time for driver to reach pickup
            estimated_fare: Estimated fare for the ride
        """
        self.ride_id = ride_id
        self.request = request
        self.driver = driver
        self.driver_to_pickup_path = driver_to_pickup_path
        self.pickup_to_dropoff_path = pickup_to_dropoff_path
        self.estimated_pickup_time = estimated_pickup_time
        self.estimated_fare = estimated_fare
        
        self.status = RideStatus.ACCEPTED
        self.start_time = time.time()
        self.pickup_time = None
        self.completion_time = None
        
        # Progress tracking
        self.current_path = driver_to_pickup_path
        self.current_path_segment = 0
        self.segment_progress = 0.0  # 0.0 to 1.0
    
    def update_status(self, new_status: str):
        """
        Update the ride status.
        
        Args:
            new_status: New ride status
        """
        self.status = new_status
        
        if new_status == RideStatus.ARRIVED:
            self.pickup_time = time.time()
            # Switch to pickup-to-dropoff path
            self.current_path = self.pickup_to_dropoff_path
            self.current_path_segment = 0
            self.segment_progress = 0.0
        
        elif new_status == RideStatus.COMPLETED:
            self.completion_time = time.time()
    
    def get_current_segment(self) -> Tuple[str, str]:
        """
        Get the current path segment.
        
        Returns:
            Tuple of (from_node_id, to_node_id)
        """
        if self.current_path_segment >= len(self.current_path) - 1:
            return (self.current_path[-2], self.current_path[-1])
        
        return (self.current_path[self.current_path_segment], 
                self.current_path[self.current_path_segment + 1])
    
    def update_progress(self, delta_time: float, graph: CityGraph, speed: float = 30.0):
        """
        Update the ride progress based on time elapsed.
        
        Args:
            delta_time: Time elapsed in seconds
            graph: The city graph
            speed: Speed in km/h
            
        Returns:
            True if segment completed, False otherwise
        """
        if self.status == RideStatus.COMPLETED or self.status == RideStatus.CANCELLED:
            return False
        
        # Convert speed from km/h to km/s
        speed_kms = speed / 3600.0
        
        # Calculate distance covered in this time step
        distance_covered = speed_kms * delta_time
        
        # Get current segment
        from_node_id, to_node_id = self.get_current_segment()
        from_node = graph.get_node(from_node_id)
        to_node = graph.get_node(to_node_id)
        
        if not from_node or not to_node:
            return False
        
        # Calculate segment distance
        segment_distance = haversine_distance(
            from_node.lat, from_node.lng,
            to_node.lat, to_node.lng
        )
        
        # Calculate progress increment
        progress_increment = distance_covered / segment_distance
        self.segment_progress += progress_increment
        
        # Check if segment is completed
        if self.segment_progress >= 1.0:
            # Move to next segment
            self.current_path_segment += 1
            self.segment_progress = 0.0
            
            # Check if we've finished the current path
            if self.current_path_segment >= len(self.current_path) - 1:
                if self.status == RideStatus.DRIVER_EN_ROUTE:
                    # Driver has arrived at pickup
                    self.update_status(RideStatus.ARRIVED)
                    return True
                
                elif self.status == RideStatus.IN_PROGRESS:
                    # Ride is completed
                    self.update_status(RideStatus.COMPLETED)
                    return True
            
            return True  # Segment completed
        
        return False  # Segment still in progress
    
    def get_current_location(self, graph: CityGraph) -> Tuple[float, float]:
        """
        Get the current location (lat, lng) based on path progress.
        
        Args:
            graph: The city graph
            
        Returns:
            (latitude, longitude) tuple
        """
        from_node_id, to_node_id = self.get_current_segment()
        from_node = graph.get_node(from_node_id)
        to_node = graph.get_node(to_node_id)
        
        if not from_node or not to_node:
            return (0, 0)
        
        # Interpolate position
        lat = from_node.lat + (to_node.lat - from_node.lat) * self.segment_progress
        lng = from_node.lng + (to_node.lng - from_node.lng) * self.segment_progress
        
        return (lat, lng)


class RideSimulator:
    """Class for simulating rides in real-time."""
    
    def __init__(self, city_graph: CityGraph):
        """
        Initialize the ride simulator.
        
        Args:
            city_graph: The city graph
        """
        self.city_graph = city_graph
        self.driver_matcher = DriverMatcher(city_graph)
        self.active_rides = {}  # ride_id -> ActiveRide
        self.simulation_speed = 10.0  # 10x real time
        self.is_running = False
        self.simulation_thread = None
        self.last_update_time = None
        self.observers = []  # Callbacks for simulation updates
    
    def add_driver(self, driver: Driver):
        """
        Add a driver to the simulation.
        
        Args:
            driver: The driver to add
        """
        self.driver_matcher.add_driver(driver)
    
    def add_drivers(self, drivers: List[Driver]):
        """
        Add multiple drivers to the simulation.
        
        Args:
            drivers: List of drivers to add
        """
        for driver in drivers:
            self.add_driver(driver)
    
    def create_ride_request(self, pickup_lat: float, pickup_lng: float,
                           dropoff_lat: float, dropoff_lng: float,
                           vehicle_type: str = 'sedan') -> RideRequest:
        """
        Create a ride request.
        
        Args:
            pickup_lat: Pickup latitude
            pickup_lng: Pickup longitude
            dropoff_lat: Dropoff latitude
            dropoff_lng: Dropoff longitude
            vehicle_type: Type of vehicle requested
            
        Returns:
            New ride request
        """
        request = RideRequest(
            id=f"request-{int(time.time())}",
            user_id="user-001",
            pickup_location=(pickup_lat, pickup_lng),
            dropoff_location=(dropoff_lat, dropoff_lng),
            vehicle_type=vehicle_type
        )
        
        # Prepare the request (find nearest nodes)
        return self.driver_matcher.prepare_ride_request(request)
    
    def request_ride(self, request: RideRequest) -> Dict:
        """
        Request a ride and find matching drivers.
        
        Args:
            request: The ride request
            
        Returns:
            Dictionary with matching results
        """
        # Find matching drivers
        matched_drivers = self.driver_matcher.match_driver_to_request(request)
        
        return {
            'request_id': request.id,
            'matched_drivers': matched_drivers
        }
    
    def confirm_ride(self, request: RideRequest, driver_id: str) -> Dict:
        """
        Confirm a ride with a specific driver.
        
        Args:
            request: The ride request
            driver_id: ID of the selected driver
            
        Returns:
            Dictionary with ride details or error
        """
        # Check if driver exists and is available
        if driver_id not in self.driver_matcher.drivers:
            return {'error': 'Driver not found'}
        
        driver = self.driver_matcher.drivers[driver_id]
        
        if driver.status != DriverStatus.AVAILABLE:
            return {'error': 'Driver is not available'}
        
        # Find paths
        driver_to_pickup = find_optimal_path(
            self.city_graph, driver.nearest_node_id, request.pickup_node_id,
            algorithm='a_star', cost_type='time'
        )
        
        pickup_to_dropoff = find_optimal_path(
            self.city_graph, request.pickup_node_id, request.dropoff_node_id,
            algorithm='a_star', cost_type='time'
        )
        
        # Create ride ID
        ride_id = f"ride-{int(time.time())}"
        
        # Estimate fare
        estimated_fare = self.driver_matcher.estimate_fare(request, pickup_to_dropoff)
        
        # Create active ride
        active_ride = ActiveRide(
            ride_id=ride_id,
            request=request,
            driver=driver,
            driver_to_pickup_path=reconstruct_path(
                driver_to_pickup['predecessors'], driver.nearest_node_id, request.pickup_node_id
            ),
            pickup_to_dropoff_path=reconstruct_path(
                pickup_to_dropoff['predecessors'], request.pickup_node_id, request.dropoff_node_id
            ),
            estimated_pickup_time=driver_to_pickup['total_time'],
            estimated_fare=estimated_fare
        )
        
        # Update driver status
        self.driver_matcher.update_driver_status(driver_id, "busy")
        
        # Update ride status
        active_ride.update_status(RideStatus.DRIVER_EN_ROUTE)
        
        # Add to active rides
        self.active_rides[ride_id] = active_ride
        
        return {
            'ride_id': ride_id,
            'status': active_ride.status,
            'driver': {
                'id': driver.id,
                'name': driver.name,
                'rating': driver.rating,
                'vehicle_type': driver.vehicle_type
            },
            'estimated_pickup_time': active_ride.estimated_pickup_time,
            'estimated_fare': active_ride.estimated_fare,
            'pickup_path': {
                'nodes': driver_to_pickup['nodes'],
                'distance': driver_to_pickup['total_distance'],
                'time': driver_to_pickup['total_time']
            },
            'dropoff_path': {
                'nodes': pickup_to_dropoff['nodes'],
                'distance': pickup_to_dropoff['total_distance'],
                'time': pickup_to_dropoff['total_time']
            }
        }
    
    def get_ride_status(self, ride_id: str) -> Dict:
        """
        Get the status of a ride.
        
        Args:
            ride_id: ID of the ride
            
        Returns:
            Dictionary with ride status
        """
        if ride_id not in self.active_rides:
            return {'error': 'Ride not found'}
        
        ride = self.active_rides[ride_id]
        
        # Get current location
        current_location = ride.get_current_location(self.city_graph)
        
        return {
            'ride_id': ride.ride_id,
            'status': ride.status,
            'driver': {
                'id': ride.driver.id,
                'name': ride.driver.name,
                'current_location': current_location
            },
            'progress': {
                'path_segment': ride.current_path_segment,
                'segment_progress': ride.segment_progress,
                'pickup_time': ride.pickup_time,
                'completion_time': ride.completion_time
            },
            'estimated_pickup_time': ride.estimated_pickup_time,
            'estimated_fare': ride.estimated_fare
        }
    
    def start_ride(self, ride_id: str) -> Dict:
        """
        Start a ride (after driver has arrived at pickup).
        
        Args:
            ride_id: ID of the ride
            
        Returns:
            Dictionary with ride status
        """
        if ride_id not in self.active_rides:
            return {'error': 'Ride not found'}
        
        ride = self.active_rides[ride_id]
        
        if ride.status != RideStatus.ARRIVED:
            return {'error': 'Driver has not arrived at pickup yet'}
        
        # Update ride status
        ride.update_status(RideStatus.IN_PROGRESS)
        
        return self.get_ride_status(ride_id)
    
    def cancel_ride(self, ride_id: str) -> Dict:
        """
        Cancel a ride.
        
        Args:
            ride_id: ID of the ride
            
        Returns:
            Dictionary with ride status
        """
        if ride_id not in self.active_rides:
            return {'error': 'Ride not found'}
        
        ride = self.active_rides[ride_id]
        
        # Update ride status
        ride.update_status(RideStatus.CANCELLED)
        
        # Update driver status
        self.driver_matcher.update_driver_status(ride.driver.id, "available")
        
        return self.get_ride_status(ride_id)
    
    def complete_ride(self, ride_id: str) -> Dict:
        """
        Complete a ride (manually).
        
        Args:
            ride_id: ID of the ride
            
        Returns:
            Dictionary with ride status
        """
        if ride_id not in self.active_rides:
            return {'error': 'Ride not found'}
        
        ride = self.active_rides[ride_id]
        
        if ride.status != RideStatus.IN_PROGRESS:
            return {'error': 'Ride is not in progress'}
        
        # Update ride status
        ride.update_status(RideStatus.COMPLETED)
        
        # Update driver status
        self.driver_matcher.update_driver_status(ride.driver.id, "available")
        
        return self.get_ride_status(ride_id)
    
    def add_observer(self, callback):
        """
        Add an observer to receive simulation updates.
        
        Args:
            callback: Function to call with updates
        """
        self.observers.append(callback)
    
    def notify_observers(self):
        """Notify all observers of simulation state."""
        simulation_state = self.get_simulation_state()
        for observer in self.observers:
            observer(simulation_state)
    
    def get_simulation_state(self) -> Dict:
        """
        Get the current state of the simulation.
        
        Returns:
            Dictionary with simulation state
        """
        active_rides_state = {}
        
        for ride_id, ride in self.active_rides.items():
            if ride.status in [RideStatus.COMPLETED, RideStatus.CANCELLED]:
                continue
            
            current_location = ride.get_current_location(self.city_graph)
            
            active_rides_state[ride_id] = {
                'ride_id': ride.ride_id,
                'status': ride.status,
                'driver': {
                    'id': ride.driver.id,
                    'name': ride.driver.name,
                    'current_location': current_location
                },
                'pickup': ride.request.pickup_location,
                'dropoff': ride.request.dropoff_location,
                'progress': {
                    'path_segment': ride.current_path_segment,
                    'segment_progress': ride.segment_progress
                }
            }
        
        available_drivers = []
        for driver in self.driver_matcher.get_available_drivers():
            available_drivers.append({
                'id': driver.id,
                'name': driver.name,
                'location': driver.current_location,
                'vehicle_type': driver.vehicle_type
            })
        
        return {
            'timestamp': datetime.now().isoformat(),
            'active_rides': active_rides_state,
            'available_drivers': available_drivers
        }
    
    def simulation_loop(self):
        """Main simulation loop."""
        self.last_update_time = time.time()
        
        while self.is_running:
            # Calculate time since last update
            current_time = time.time()
            delta_time = (current_time - self.last_update_time) * self.simulation_speed
            self.last_update_time = current_time
            
            # Update all active rides
            for ride_id, ride in list(self.active_rides.items()):
                if ride.status in [RideStatus.DRIVER_EN_ROUTE, RideStatus.IN_PROGRESS]:
                    segment_completed = ride.update_progress(delta_time, self.city_graph)
                    
                    if segment_completed:
                        # If driver arrived at pickup and ride not started yet
                        if ride.status == RideStatus.ARRIVED:
                            # Auto-start ride after a short delay
                            time.sleep(1.0 / self.simulation_speed)
                            self.start_ride(ride_id)
                    
                    # Update driver location
                    current_location = ride.get_current_location(self.city_graph)
                    self.driver_matcher.update_driver_location(ride.driver.id, current_location)
                
                # If ride is completed, update driver status after a delay
                if ride.status == RideStatus.COMPLETED and ride.completion_time:
                    if current_time - ride.completion_time > 5.0:
                        self.driver_matcher.update_driver_status(ride.driver.id, "available")
            
            # Notify observers
            self.notify_observers()
            
            # Sleep
            time.sleep(0.1)
    
    def start_simulation(self):
        """Start the simulation."""
        if self.is_running:
            return
        
        self.is_running = True
        self.simulation_thread = threading.Thread(target=self.simulation_loop)
        self.simulation_thread.daemon = True
        self.simulation_thread.start()
    
    def stop_simulation(self):
        """Stop the simulation."""
        self.is_running = False
        if self.simulation_thread:
            self.simulation_thread.join(timeout=1.0)
            self.simulation_thread = None


def print_simulation_update(simulation_state):
    """
    Print simulation state updates to console.
    
    Args:
        simulation_state: Current simulation state
    """
    print(f"\n--- Simulation Update: {simulation_state['timestamp']} ---")
    
    print(f"Active Rides: {len(simulation_state['active_rides'])}")
    for ride_id, ride_state in simulation_state['active_rides'].items():
        print(f"  Ride {ride_id}: {ride_state['status']}")
        print(f"    Driver: {ride_state['driver']['name']} at {ride_state['driver']['current_location']}")
        print(f"    Progress: Segment {ride_state['progress']['path_segment']}, " + 
              f"{ride_state['progress']['segment_progress'] * 100:.1f}%")
    
    print(f"Available Drivers: {len(simulation_state['available_drivers'])}")
    for driver in simulation_state['available_drivers'][:3]:  # Show just a few
        print(f"  {driver['name']} ({driver['vehicle_type']})")
    
    if len(simulation_state['available_drivers']) > 3:
        print(f"  ... and {len(simulation_state['available_drivers']) - 3} more")
    
    print("-" * 50)


def run_demo_simulation():
    """Run a demonstration of the ride simulation."""
    import os
    from .city_graph import CityGraph, create_demo_city_graph
    from .driver_matching import create_demo_drivers
    
    # Create or load the city graph
    graph_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'city_graph.json')
    
    try:
        city_graph = CityGraph.load_from_file(graph_file)
        print(f"Loaded city graph from {graph_file}")
    except FileNotFoundError:
        print(f"Creating new demo city graph")
        city_graph = create_demo_city_graph()
        os.makedirs(os.path.dirname(graph_file), exist_ok=True)
        city_graph.save_to_file(graph_file)
    
    # Create the simulator
    simulator = RideSimulator(city_graph)
    
    # Add demo drivers
    demo_drivers = create_demo_drivers(city_graph)
    simulator.add_drivers(demo_drivers)
    
    print(f"Added {len(demo_drivers)} demo drivers")
    
    # Add observer
    simulator.add_observer(print_simulation_update)
    
    # Start simulation
    simulator.start_simulation()
    print("Simulation started")
    
    try:
        # Create a ride request (from Majestic to Indiranagar in Bangalore)
        request = simulator.create_ride_request(
            12.9716, 77.5946,  # Majestic
            12.9626, 77.6371,  # Indiranagar
            'sedan'
        )
        
        print("\nCreated ride request:")
        print(f"  From: {request.pickup_location} (Node {request.pickup_node_id})")
        print(f"  To: {request.dropoff_location} (Node {request.dropoff_node_id})")
        
        # Match drivers
        match_result = simulator.request_ride(request)
        print(f"\nFound {len(match_result['matched_drivers'])} matching drivers")
        
        if match_result['matched_drivers']:
            # Select first driver
            driver = match_result['matched_drivers'][0]
            print(f"Selected driver: {driver['driver']['name']}")
            print(f"ETA: {driver['eta_minutes']} minutes")
            print(f"Estimated fare: ₹{driver['estimated_fare']}")
            
            # Confirm ride
            confirm_result = simulator.confirm_ride(request, driver['driver']['id'])
            print(f"\nRide confirmed: {confirm_result['ride_id']}")
            
            # Let simulation run for a while
            simulation_time = 60  # seconds
            print(f"\nRunning simulation for {simulation_time} seconds...")
            
            ride_id = confirm_result['ride_id']
            start_time = time.time()
            
            while time.time() - start_time < simulation_time:
                # Get ride status every 10 seconds
                if (time.time() - start_time) % 10 < 0.1:
                    ride_status = simulator.get_ride_status(ride_id)
                    print(f"\nRide status: {ride_status['status']}")
                    if ride_status['status'] == RideStatus.COMPLETED:
                        print("Ride completed!")
                        break
                
                time.sleep(0.1)
                
            # Complete ride if not already completed
            ride_status = simulator.get_ride_status(ride_id)
            if ride_status['status'] != RideStatus.COMPLETED:
                simulator.complete_ride(ride_id)
                print("\nRide manually completed")
        
        # Run for a bit longer to show drivers becoming available again
        time.sleep(10)
        
    except KeyboardInterrupt:
        print("\nSimulation interrupted by user")
    
    # Stop simulation
    simulator.stop_simulation()
    print("Simulation stopped")


if __name__ == "__main__":
    run_demo_simulation()
