from flask import Blueprint, request, jsonify
import json
import os
import random
import math
from datetime import datetime

match_bp = Blueprint('match', __name__)

# Helper function to calculate distance between two coordinates using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of Earth in kilometers
    return c * r

# Helper function to load drivers from JSON file
def load_drivers():
    drivers_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'drivers.json')
    try:
        if os.path.exists(drivers_file):
            with open(drivers_file, 'r') as file:
                return json.load(file)
        return []
    except Exception as e:
        print(f"Error loading drivers: {e}")
        return []

# Helper function to update driver status
def update_driver_status(driver_id, status, current_location=None):
    drivers_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'drivers.json')
    try:
        drivers = []
        if os.path.exists(drivers_file):
            with open(drivers_file, 'r') as file:
                drivers = json.load(file)
        
        for driver in drivers:
            if driver.get('id') == driver_id:
                driver['status'] = status
                if current_location:
                    driver['current_location'] = current_location
                driver['last_updated'] = datetime.now().isoformat()
        
        with open(drivers_file, 'w') as file:
            json.dump(drivers, file, indent=2)
        return True
    except Exception as e:
        print(f"Error updating driver status: {e}")
        return False

@match_bp.route('/find', methods=['POST'])
def find_match():
    data = request.get_json()
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    
    pickup_location = data.get('pickup_location')
    drop_location = data.get('drop_location')
    ride_type = data.get('ride_type', 'mini')  # Default to 'mini' if not specified
    
    if not pickup_location or not drop_location:
        return jsonify({'status': 'error', 'message': 'Pickup and drop locations are required'}), 400
    
    # Extract coordinates
    try:
        pickup_lat = float(pickup_location.get('lat'))
        pickup_lng = float(pickup_location.get('lng'))
        drop_lat = float(drop_location.get('lat'))
        drop_lng = float(drop_location.get('lng'))
    except (ValueError, TypeError, AttributeError):
        return jsonify({'status': 'error', 'message': 'Invalid location coordinates'}), 400
    
    # Load all available drivers
    all_drivers = load_drivers()
    
    # Filter drivers by availability and ride type
    available_drivers = []
    for driver in all_drivers:
        if driver.get('status') == 'available' and ride_type in driver.get('ride_types', ['mini']):
            # Calculate distance from pickup
            try:
                driver_lat = float(driver.get('current_location', {}).get('lat', 0))
                driver_lng = float(driver.get('current_location', {}).get('lng', 0))
                
                distance_to_pickup = calculate_distance(pickup_lat, pickup_lng, driver_lat, driver_lng)
                
                # Only consider drivers within 10km of pickup location
                if distance_to_pickup <= 10:
                    driver['distance_to_pickup'] = distance_to_pickup
                    available_drivers.append(driver)
            except (ValueError, TypeError):
                continue
    
    # Sort drivers by distance to pickup
    available_drivers.sort(key=lambda x: x.get('distance_to_pickup', float('inf')))
    
    # If no drivers available, return error
    if not available_drivers:
        return jsonify({
            'status': 'error', 
            'message': 'No drivers available near your location. Please try again later.'
        }), 404
    
    # Select the closest driver
    matched_driver = available_drivers[0]
    
    # Calculate ETA based on distance (simplified: assume 2 min per km with minimum of 3 minutes)
    eta_minutes = max(3, round(matched_driver.get('distance_to_pickup', 0) * 2))
    
    # Update driver status to 'assigned'
    update_driver_status(matched_driver.get('id'), 'assigned')
    
    # Calculate ride distance and fare
    ride_distance = calculate_distance(pickup_lat, pickup_lng, drop_lat, drop_lng)
    
    # Base fare calculation (simplified)
    base_fare = 50  # Base fare in rupees
    per_km_rate = {
        'mini': 12,
        'sedan': 15,
        'premium': 20,
        'xl': 25
    }.get(ride_type, 12)  # Default to mini rate if ride_type not found
    
    estimated_fare = round(base_fare + (ride_distance * per_km_rate))
    
    # Return matched driver details
    return jsonify({
        'status': 'success',
        'message': 'Driver found successfully',
        'driver': {
            'id': matched_driver.get('id'),
            'name': matched_driver.get('name'),
            'phone': matched_driver.get('phone'),
            'rating': matched_driver.get('rating', 4.5),
            'vehicle': matched_driver.get('vehicle', {}),
            'photo': matched_driver.get('photo', ''),
            'distance_to_pickup': round(matched_driver.get('distance_to_pickup', 0), 1)
        },
        'ride': {
            'distance': round(ride_distance, 1),
            'eta': eta_minutes,
            'fare': estimated_fare
        }
    })

@match_bp.route('/driver/status', methods=['POST'])
def update_driver_location_status():
    data = request.get_json()
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    
    driver_id = data.get('driver_id')
    status = data.get('status')
    current_location = data.get('current_location')
    
    if not driver_id or not status:
        return jsonify({'status': 'error', 'message': 'Driver ID and status are required'}), 400
    
    # Update driver status
    success = update_driver_status(driver_id, status, current_location)
    
    if success:
        return jsonify({'status': 'success', 'message': 'Driver status updated successfully'})
    else:
        return jsonify({'status': 'error', 'message': 'Failed to update driver status'}), 500

@match_bp.route('/ride/status', methods=['POST'])
def update_ride_status():
    data = request.get_json()
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
    
    ride_id = data.get('ride_id')
    status = data.get('status')
    
    if not ride_id or not status:
        return jsonify({'status': 'error', 'message': 'Ride ID and status are required'}), 400
    
    # Here we would update the ride status in a database
    # For now, we'll just return success
    
    return jsonify({
        'status': 'success', 
        'message': f'Ride status updated to {status}'
    })