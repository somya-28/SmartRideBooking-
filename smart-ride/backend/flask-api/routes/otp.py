from flask import Blueprint, request, jsonify
import random
import os
import json
from datetime import datetime, timedelta

otp_bp = Blueprint('otp', __name__)

# Simple file-based storage for OTPs
OTP_DB_FILE = os.path.join(os.path.dirname(__file__), '../database/otps.json')

def get_otps():
    if not os.path.exists(os.path.dirname(OTP_DB_FILE)):
        os.makedirs(os.path.dirname(OTP_DB_FILE))
    
    if not os.path.exists(OTP_DB_FILE):
        with open(OTP_DB_FILE, 'w') as f:
            json.dump({}, f)
        return {}
    
    with open(OTP_DB_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_otps(otps):
    with open(OTP_DB_FILE, 'w') as f:
        json.dump(otps, f, indent=2)

@otp_bp.route('/generate', methods=['POST'])
def generate_otp():
    data = request.get_json()
    print(f"OTP Generate Request: {data}")
    
    if not data or not data.get('email'):
        print("Error: Email is required but not provided")
        return jsonify({'status': 'error', 'message': 'Email is required'}), 400
    
    email = data.get('email')
    print(f"Generating OTP for email: {email}")
    
    # Generate a 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    print(f"Generated OTP: {otp}")
    
    # Store OTP with expiration time (10 minutes)
    otps = get_otps()
    otps[email] = {
        'otp': otp,
        'expires_at': (datetime.now() + timedelta(minutes=10)).isoformat()
    }
    save_otps(otps)
    print(f"Saved OTP for {email}: {otp}")
    
    # In a real application, you would send this OTP via email or SMS
    # For demo purposes, we'll just return it in the response
    response_data = {
        'status': 'success',
        'message': f'OTP generated successfully: {otp}',
        'otp': otp,  # In production, you would NOT return this in the response
        'email': email
    }
    print(f"Sending response: {response_data}")
    return jsonify(response_data), 200

@otp_bp.route('/verify', methods=['POST'])
def verify_otp():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('otp'):
        return jsonify({'status': 'error', 'message': 'Email and OTP are required'}), 400
    
    email = data.get('email')
    user_otp = data.get('otp')
    
    otps = get_otps()
    
    if email not in otps:
        return jsonify({'status': 'error', 'message': 'No OTP found for this email'}), 404
    
    stored_otp_data = otps[email]
    stored_otp = stored_otp_data['otp']
    expires_at = datetime.fromisoformat(stored_otp_data['expires_at'])
    
    if datetime.now() > expires_at:
        # Remove expired OTP
        del otps[email]
        save_otps(otps)
        return jsonify({'status': 'error', 'message': 'OTP has expired'}), 400
    
    if user_otp != stored_otp:
        return jsonify({'status': 'error', 'message': 'Invalid OTP'}), 400
    
    # OTP is valid, remove it from storage
    del otps[email]
    save_otps(otps)
    
    return jsonify({
        'status': 'success',
        'message': 'OTP verified successfully'
    }), 200
