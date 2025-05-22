"""
Driver-User Matching Algorithm Module

This module provides algorithms for matching users with the most suitable drivers
based on various criteria including location, ETA, and driver characteristics.

Time Complexity Analysis:
- Finding Nearest Drivers: O(D log D) where D is the number of drivers
  * Each driver distance calculation: O(1)
  * Sorting drivers by distance: O(D log D)

- ETA Calculation: O(V log V) per driver, where V is the number of vertices in the graph
  * Using A* for optimal routing: O((V + E) log V)
  * Processing top K drivers: O(K * (V + E) log V)

Space Complexity:
- O(D + V), where D is the number of drivers and V is the number of vertices in the graph

The algorithm uses a combination of spatial proximity and pathfinding to find
the most suitable drivers for a user request.
"""

import heapq
import math
import time
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

from .city_graph import CityGraph, CityNode, haversine_distance
from .pathfinding import find_optimal_path


class DriverStatus(Enum):
    """Enum representing the status of a driver."""
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ON_TRIP = "on_trip"
    ON_BREAK = "on_break"


@dataclass
class Driver:
    """Class representing a driver in the system."""
    id: str
    name: str
    current_location: Tuple[float, float]  # (lat, lng)
    nearest_node_id: str
    status: DriverStatus
    vehicle_type: str
    rating: float
    total_trips: int
    
    def __init__(self, 
                 id: str, 
                 name: str, 
                 current_location: Tuple[float, float],
                 nearest_node_id: str = None,
                 status: str = "available",
                 vehicle_type: str = "sedan",
                 rating: float = 4.5,
                 total_trips: int = 0):
        """
        Initialize a driver.
        
        Args:
            id: Driver ID
            name: Driver name
            current_location: (latitude, longitude) tuple
            nearest_node_id: ID of the nearest node in the city graph
            status: Driver status (available, busy, offline, etc.)
            vehicle_type: Type of vehicle (sedan, suv, etc.)
            rating: Driver rating (0-5)
            total_trips: Total number of trips completed
        """
        self.id = id
        self.name = name
        self.current_location = current_location
        self.nearest_node_id = nearest_node_id
        self.status = DriverStatus(status)
        self.vehicle_type = vehicle_type
        self.rating = rating
        self.total_trips = total_trips


@dataclass
class RideRequest:
    """Class representing a ride request from a user."""
    id: str
    user_id: str
    pickup_location: Tuple[float, float]  # (lat, lng)
    pickup_node_id: str
    dropoff_location: Tuple[float, float]  # (lat, lng)
    dropoff_node_id: str
    vehicle_type: str
    timestamp: float
    
    def __init__(self,
                 id: str,
                 user_id: str,
                 pickup_location: Tuple[float, float],
                 pickup_node_id: str = None,
                 dropoff_location: Tuple[float, float] = None,
                 dropoff_node_id: str = None,
                 vehicle_type: str = "sedan",
                 timestamp: float = None):
        """
        Initialize a ride request.
        
        Args:
            id: Request ID
            user_id: User ID
            pickup_location: (latitude, longitude) tuple for pickup
            pickup_node_id: ID of the nearest node to pickup location
            dropoff_location: (latitude, longitude) tuple for dropoff
            dropoff_node_id: ID of the nearest node to dropoff location
            vehicle_type: Type of vehicle requested
            timestamp: Timestamp of the request
        """
        self.id = id
        self.user_id = user_id
        self.pickup_location = pickup_location
        self.pickup_node_id = pickup_node_id
        self.dropoff_location = dropoff_location
        self.dropoff_node_id = dropoff_node_id
        self.vehicle_type = vehicle_type
        self.timestamp = timestamp or time.time()


class DriverMatcher:
    """Class for matching drivers to ride requests."""
    
    def __init__(self, city_graph: CityGraph):
        """
        Initialize the driver matcher.
        
        Args:
            city_graph: The city graph for pathfinding
        """
        self.city_graph = city_graph
        self.drivers = {}  # Dictionary of driver_id -> Driver
    
    def add_driver(self, driver: Driver):
        """
        Add a driver to the system.
        
        Args:
            driver: The driver to add
        """
        # Set the nearest node ID if not already set
        if not driver.nearest_node_id:
            nearest_node_id, _ = self.city_graph.get_nearest_node(
                driver.current_location[0], driver.current_location[1]
            )
            driver.nearest_node_id = nearest_node_id
        
        self.drivers[driver.id] = driver
    
    def update_driver_location(self, driver_id: str, location: Tuple[float, float]):
        """
        Update a driver's location.
        
        Args:
            driver_id: ID of the driver to update
            location: New (latitude, longitude) tuple
        
        Returns:
            True if successful, False otherwise
        """
        if driver_id not in self.drivers:
            return False
        
        # Update location
        self.drivers[driver_id].current_location = location
        
        # Update nearest node
        nearest_node_id, _ = self.city_graph.get_nearest_node(location[0], location[1])
        self.drivers[driver_id].nearest_node_id = nearest_node_id
        
        return True
    
    def update_driver_status(self, driver_id: str, status: str):
        """
        Update a driver's status.
        
        Args:
            driver_id: ID of the driver to update
            status: New status
        
        Returns:
            True if successful, False otherwise
        """
        if driver_id not in self.drivers:
            return False
        
        try:
            self.drivers[driver_id].status = DriverStatus(status)
            return True
        except ValueError:
            return False
    
    def prepare_ride_request(self, request: RideRequest):
        """
        Prepare a ride request by finding the nearest nodes for pickup and dropoff.
        
        Args:
            request: The ride request to prepare
        
        Returns:
            The prepared ride request
        """
        if not request.pickup_node_id:
            pickup_node_id, _ = self.city_graph.get_nearest_node(
                request.pickup_location[0], request.pickup_location[1]
            )
            request.pickup_node_id = pickup_node_id
        
        if not request.dropoff_node_id and request.dropoff_location:
            dropoff_node_id, _ = self.city_graph.get_nearest_node(
                request.dropoff_location[0], request.dropoff_location[1]
            )
            request.dropoff_node_id = dropoff_node_id
        
        return request
    
    def get_available_drivers(self, vehicle_type: str = None) -> List[Driver]:
        """
        Get all available drivers, optionally filtered by vehicle type.
        
        Args:
            vehicle_type: Optional vehicle type to filter by
        
        Returns:
            List of available drivers
        """
        available_drivers = []
        
        for driver in self.drivers.values():
            if driver.status == DriverStatus.AVAILABLE:
                if vehicle_type is None or driver.vehicle_type == vehicle_type:
                    available_drivers.append(driver)
        
        return available_drivers
    
    def find_nearest_drivers(self, location: Tuple[float, float], 
                            max_count: int = 5, 
                            max_distance: float = 10.0,
                            vehicle_type: str = None) -> List[Tuple[Driver, float]]:
        """
        Find the nearest available drivers to a location.
        
        Args:
            location: (latitude, longitude) tuple
            max_count: Maximum number of drivers to return
            max_distance: Maximum distance in kilometers
            vehicle_type: Optional vehicle type to filter by
        
        Returns:
            List of (driver, distance) tuples, sorted by distance
        """
        available_drivers = self.get_available_drivers(vehicle_type)
        drivers_with_distance = []
        
        for driver in available_drivers:
            distance = haversine_distance(
                location[0], location[1], 
                driver.current_location[0], driver.current_location[1]
            )
            
            if distance <= max_distance:
                drivers_with_distance.append((driver, distance))
        
        # Sort by distance
        drivers_with_distance.sort(key=lambda x: x[1])
        
        # Limit to max_count
        return drivers_with_distance[:max_count]
    
    def calculate_driver_eta(self, driver: Driver, pickup_node_id: str) -> Dict:
        """
        Calculate the estimated time of arrival for a driver to a pickup location.
        
        Args:
            driver: The driver
            pickup_node_id: ID of the pickup node
        
        Returns:
            Dictionary with path details
        """
        # Find the path from driver to pickup
        path_details = find_optimal_path(
            self.city_graph, driver.nearest_node_id, pickup_node_id, 
            algorithm='a_star', cost_type='time'
        )
        
        # Add the direct distance from driver's current location to their nearest node
        if driver.nearest_node_id in self.city_graph.nodes:
            nearest_node = self.city_graph.get_node(driver.nearest_node_id)
            direct_distance = haversine_distance(
                driver.current_location[0], driver.current_location[1],
                nearest_node.lat, nearest_node.lng
            )
            
            # Assume 2 minutes per km
            direct_time = direct_distance * 2
            
            path_details['total_distance'] += direct_distance
            path_details['total_time'] += direct_time
        
        return path_details
    
    def match_driver_to_request(self, request: RideRequest,
                               max_candidates: int = 5,
                               max_distance: float = 10.0) -> List[Dict]:
        """
        Match the best drivers to a ride request.
        
        Args:
            request: The ride request
            max_candidates: Maximum number of candidate drivers to consider
            max_distance: Maximum initial distance in kilometers
        
        Returns:
            List of matched driver details, sorted by ETA
        """
        # Prepare the request if needed
        request = self.prepare_ride_request(request)
        
        # Find the nearest drivers
        nearest_drivers = self.find_nearest_drivers(
            request.pickup_location, 
            max_count=max_candidates,
            max_distance=max_distance,
            vehicle_type=request.vehicle_type
        )
        
        matched_drivers = []
        
        for driver, direct_distance in nearest_drivers:
            # Calculate ETA
            eta_details = self.calculate_driver_eta(driver, request.pickup_node_id)
            
            # Estimate fare
            estimated_fare = self.estimate_fare(request, eta_details)
            
            # Add driver to results
            matched_drivers.append({
                'driver': {
                    'id': driver.id,
                    'name': driver.name,
                    'rating': driver.rating,
                    'vehicle_type': driver.vehicle_type,
                    'total_trips': driver.total_trips,
                    'current_location': driver.current_location
                },
                'direct_distance': round(direct_distance, 2),
                'route_distance': eta_details['total_distance'],
                'eta_minutes': math.ceil(eta_details['total_time']),
                'estimated_fare': estimated_fare
            })
        
        # Sort by ETA
        matched_drivers.sort(key=lambda x: x['eta_minutes'])
        
        return matched_drivers
    
    def estimate_fare(self, request: RideRequest, eta_details: Dict) -> float:
        """
        Estimate the fare for a ride.
        
        Args:
            request: The ride request
            eta_details: ETA details including distance and time
        
        Returns:
            Estimated fare
        """
        # Simple fare calculation
        base_fare = 50  # Base fare in rupees
        
        # Different rates based on vehicle type
        per_km_rate = {
            'mini': 12,
            'sedan': 15,
            'premium': 20,
            'suv': 18,
            'xl': 25
        }.get(request.vehicle_type.lower(), 15)  # Default to sedan rate
        
        # Calculate ride distance (if dropoff is specified)
        ride_distance = 0
        if request.pickup_node_id and request.dropoff_node_id:
            # Find the path details
            path_details = find_optimal_path(
                self.city_graph, request.pickup_node_id, request.dropoff_node_id,
                algorithm='a_star', cost_type='distance'
            )
            ride_distance = path_details['total_distance']
        else:
            # If no dropoff specified, use a placeholder distance
            ride_distance = 5.0  # Default 5km
        
        # Calculate fare
        estimated_fare = base_fare + (ride_distance * per_km_rate)
        
        # Apply time of day surge factor (example: 1.5x during peak hours)
        current_hour = time.localtime().tm_hour
        if (current_hour >= 8 and current_hour <= 10) or (current_hour >= 17 and current_hour <= 19):
            estimated_fare *= 1.5
        
        return round(estimated_fare, 2)


def create_demo_drivers(city_graph: CityGraph) -> List[Driver]:
    """
    Create demo drivers in the city.
    
    Args:
        city_graph: The city graph
    
    Returns:
        List of demo drivers
    """
    # Sample locations around Bangalore (for demo purposes)
    driver_locations = [
        (12.9742, 77.6033),  # Near Cubbon Park
        (12.9652, 77.5831),  # Near Lalbagh
        (12.9779, 77.6408),  # Near Indiranagar
        (12.9254, 77.5963),  # Near Jayanagar
        (12.9352, 77.6245),  # Near Koramangala
        (12.9615, 77.5891),  # Near Richmond Circle
        (12.9866, 77.5641),  # Near Malleshwaram
        (12.9698, 77.7499),  # Near Whitefield
    ]
    
    vehicle_types = ['mini', 'sedan', 'premium', 'suv', 'xl']
    
    drivers = []
    
    for i, location in enumerate(driver_locations):
        # Get the nearest node
        nearest_node_id, _ = city_graph.get_nearest_node(location[0], location[1])
        
        # Create a driver
        driver = Driver(
            id=f"driver-{i+1:03d}",
            name=f"Driver {i+1}",
            current_location=location,
            nearest_node_id=nearest_node_id,
            status="available",
            vehicle_type=vehicle_types[i % len(vehicle_types)],
            rating=4.0 + (i % 10) / 10,  # Ratings between 4.0 and 4.9
            total_trips=100 + (i * 50)  # Between 100 and 450 trips
        )
        
        drivers.append(driver)
    
    return drivers


def simulate_ride_request(pickup_lat: float, pickup_lng: float,
                         dropoff_lat: float, dropoff_lng: float,
                         vehicle_type: str = 'sedan') -> RideRequest:
    """
    Create a simulated ride request.
    
    Args:
        pickup_lat: Pickup latitude
        pickup_lng: Pickup longitude
        dropoff_lat: Dropoff latitude
        dropoff_lng: Dropoff longitude
        vehicle_type: Type of vehicle requested
    
    Returns:
        Simulated ride request
    """
    return RideRequest(
        id=f"request-{int(time.time())}",
        user_id="user-001",
        pickup_location=(pickup_lat, pickup_lng),
        dropoff_location=(dropoff_lat, dropoff_lng),
        vehicle_type=vehicle_type
    )


if __name__ == "__main__":
    import os
    from .city_graph import CityGraph, create_demo_city_graph
    
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
    
    # Create the driver matcher
    matcher = DriverMatcher(city_graph)
    
    # Add demo drivers
    demo_drivers = create_demo_drivers(city_graph)
    for driver in demo_drivers:
        matcher.add_driver(driver)
    
    print(f"Added {len(demo_drivers)} demo drivers")
    
    # Simulate a ride request (from Majestic to Indiranagar in Bangalore)
    ride_request = simulate_ride_request(
        12.9716, 77.5946,  # Majestic
        12.9626, 77.6371,  # Indiranagar
        'sedan'
    )
    
    # Match drivers to the request
    matched_drivers = matcher.match_driver_to_request(ride_request)
    
    print(f"\nFound {len(matched_drivers)} matching drivers:")
    for i, match in enumerate(matched_drivers):
        print(f"\nDriver {i+1}: {match['driver']['name']} ({match['driver']['vehicle_type']})")
        print(f"Rating: {match['driver']['rating']}, Trips: {match['driver']['total_trips']}")
        print(f"Direct Distance: {match['direct_distance']} km")
        print(f"Route Distance: {match['route_distance']} km")
        print(f"ETA: {match['eta_minutes']} minutes")
        print(f"Estimated Fare: ₹{match['estimated_fare']}")
