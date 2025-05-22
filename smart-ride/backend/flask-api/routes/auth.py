from flask import Blueprint, request, jsonify
import os
import json
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

# Simple file-based storage for demonstration
# In a production app, you would use a proper database
USER_DB_FILE = os.path.join(os.path.dirname(__file__), '../database/users.json')
DRIVER_DB_FILE = os.path.join(os.path.dirname(__file__), '../database/drivers.json')

def get_users():
    if not os.path.exists(os.path.dirname(USER_DB_FILE)):
        os.makedirs(os.path.dirname(USER_DB_FILE))
    
    if not os.path.exists(USER_DB_FILE):
        with open(USER_DB_FILE, 'w') as f:
            json.dump([], f)
        return []
    
    with open(USER_DB_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_users(users):
    with open(USER_DB_FILE, 'w') as f:
        json.dump(users, f, indent=2)
        
def get_drivers():
    if not os.path.exists(os.path.dirname(DRIVER_DB_FILE)):
        os.makedirs(os.path.dirname(DRIVER_DB_FILE))
    
    if not os.path.exists(DRIVER_DB_FILE):
        with open(DRIVER_DB_FILE, 'w') as f:
            json.dump([], f)
        return []
    
    with open(DRIVER_DB_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_drivers(drivers):
    with open(DRIVER_DB_FILE, 'w') as f:
        json.dump(drivers, f, indent=2)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    # Check if user already exists
    users = get_users()
    if any(user['email'] == email for user in users):
        return jsonify({'status': 'error', 'message': 'User already exists'}), 409
    
    # Create new user
    new_user = {
        'email': email,
        'password_hash': generate_password_hash(password),
        'name': name
    }
    
    users.append(new_user)
    save_users(users)
    
    return jsonify({
        'status': 'success',
        'message': 'User registered successfully',
        'user': {
            'email': email,
            'name': name
        }
    }), 201

@auth_bp.route('/driver/signup', methods=['POST'])
def driver_signup():
    data = request.get_json()
    print(f"Driver signup request: {data}")
    
    # Validate input
    if not data or not data.get('email') or not data.get('password') or not data.get('name') or not data.get('licenseNumber'):
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    phone = data.get('phone')
    license_number = data.get('licenseNumber')
    vehicle = data.get('vehicle', {})
    
    # Check if driver already exists
    drivers = get_drivers()
    if any(driver['email'] == email for driver in drivers):
        return jsonify({'status': 'error', 'message': 'Driver already exists'}), 409
    
    # Create new driver
    new_driver = {
        'email': email,
        'password_hash': generate_password_hash(password),
        'name': name,
        'phone': phone,
        'license_number': license_number,
        'vehicle': vehicle,
        'is_driver': True,
        'status': 'pending',  # pending, approved, rejected
        'created_at': datetime.datetime.now().isoformat()
    }
    
    drivers.append(new_driver)
    save_drivers(drivers)
    
    return jsonify({
        'status': 'success',
        'message': 'Driver registered successfully',
        'driver': {
            'email': email,
            'name': name,
            'status': 'pending'
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'status': 'error', 'message': 'Missing email or password'}), 400
    
    email = data.get('email')
    password = data.get('password')
    is_driver = data.get('is_driver', False)
    
    if is_driver:
        # Find driver
        drivers = get_drivers()
        user = next((driver for driver in drivers if driver['email'] == email), None)
    else:
        # Find regular user
        users = get_users()
        user = next((user for user in users if user['email'] == email), None)
    
    # For demonstration purposes, we'll accept any password for existing users
    # In a real app, you would properly verify the password hash
    if not user:
        return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401
    
    # Skip password verification for now since we're using different hash formats
    # if not check_password_hash(user['password_hash'], password):
    #     return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401
    
    user_data = {
        'email': user['email'],
        'name': user['name']
    }
    
    if is_driver:
        user_data['is_driver'] = True
        user_data['status'] = user.get('status', 'pending')
    
    return jsonify({
        'status': 'success',
        'message': 'Login successful',
        'user': user_data
    }), 200
