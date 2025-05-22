"""
City Graph Representation Module

This module provides classes and functions to work with a city map representation as a graph.
The graph is represented with nodes (intersections) and edges (roads) with weights (distance/time).

Time Complexity Analysis:
- Graph Creation: O(V + E) where V is the number of vertices and E is the number of edges
- Node Lookup: O(1) using dictionary-based storage
- Edge Cost Lookup: O(1) 

Space Complexity: O(V + E) to store the entire graph
"""

import math
import json
import os
from typing import Dict, List, Set, Tuple, Optional


class CityNode:
    """Represents a node (intersection) in the city graph."""
    
    def __init__(self, node_id: str, lat: float, lng: float, name: str = None):
        """
        Initialize a city node/intersection.
        
        Args:
            node_id: Unique identifier for the node
            lat: Latitude coordinate
            lng: Longitude coordinate
            name: Optional name for the intersection/location
        """
        self.id = node_id
        self.lat = lat
        self.lng = lng
        self.name = name or f"Node {node_id}"
        self.neighbors = {}  # Dictionary of neighbor_id -> (distance, time)
    
    def add_neighbor(self, neighbor_id: str, distance: float, time: float):
        """
        Add a neighbor (connected intersection) to this node.
        
        Args:
            neighbor_id: ID of the neighbor node
            distance: Distance to the neighbor in kilometers
            time: Time to reach the neighbor in minutes
        """
        self.neighbors[neighbor_id] = (distance, time)
    
    def get_neighbor_cost(self, neighbor_id: str) -> Tuple[float, float]:
        """
        Get the cost (distance and time) to a neighboring node.
        
        Args:
            neighbor_id: ID of the neighbor node
            
        Returns:
            Tuple of (distance, time) to the neighbor
        """
        return self.neighbors.get(neighbor_id, (float('inf'), float('inf')))
    
    def __repr__(self):
        return f"CityNode(id={self.id}, lat={self.lat}, lng={self.lng}, name={self.name})"


class CityGraph:
    """Represents a city as a graph of nodes (intersections) connected by edges (roads)."""
    
    def __init__(self):
        """Initialize an empty city graph."""
        self.nodes = {}  # Dictionary of node_id -> CityNode
        
    def add_node(self, node: CityNode):
        """
        Add a node to the graph.
        
        Args:
            node: The CityNode to add
        """
        self.nodes[node.id] = node
    
    def add_edge(self, node1_id: str, node2_id: str, distance: float, time: float, bidirectional: bool = True):
        """
        Add an edge (road) between two nodes in the graph.
        
        Args:
            node1_id: ID of the first node
            node2_id: ID of the second node
            distance: Distance between nodes in kilometers
            time: Time to travel between nodes in minutes
            bidirectional: If True, add edges in both directions
        """
        if node1_id in self.nodes and node2_id in self.nodes:
            self.nodes[node1_id].add_neighbor(node2_id, distance, time)
            if bidirectional:
                self.nodes[node2_id].add_neighbor(node1_id, distance, time)
    
    def get_node(self, node_id: str) -> Optional[CityNode]:
        """
        Get a node from the graph by its ID.
        
        Args:
            node_id: ID of the node to get
            
        Returns:
            The CityNode object or None if not found
        """
        return self.nodes.get(node_id)
    
    def get_nodes(self) -> Dict[str, CityNode]:
        """
        Get all nodes in the graph.
        
        Returns:
            Dictionary of node_id -> CityNode
        """
        return self.nodes
    
    def get_nearest_node(self, lat: float, lng: float) -> Tuple[str, float]:
        """
        Find the nearest node to a given latitude and longitude.
        
        Args:
            lat: Latitude coordinate
            lng: Longitude coordinate
            
        Returns:
            Tuple of (node_id, distance) of the nearest node
        """
        nearest_node_id = None
        min_distance = float('inf')
        
        for node_id, node in self.nodes.items():
            distance = haversine_distance(lat, lng, node.lat, node.lng)
            if distance < min_distance:
                min_distance = distance
                nearest_node_id = node_id
        
        return nearest_node_id, min_distance
    
    def save_to_file(self, filename: str):
        """
        Save the graph to a JSON file.
        
        Args:
            filename: Path to the file to save to
        """
        graph_data = {
            "nodes": {},
            "edges": []
        }
        
        # Save nodes
        for node_id, node in self.nodes.items():
            graph_data["nodes"][node_id] = {
                "id": node.id,
                "lat": node.lat,
                "lng": node.lng,
                "name": node.name
            }
        
        # Save edges
        for node_id, node in self.nodes.items():
            for neighbor_id, (distance, time) in node.neighbors.items():
                graph_data["edges"].append({
                    "from": node_id,
                    "to": neighbor_id,
                    "distance": distance,
                    "time": time
                })
        
        with open(filename, 'w') as f:
            json.dump(graph_data, f, indent=2)
    
    @classmethod
    def load_from_file(cls, filename: str) -> 'CityGraph':
        """
        Load a graph from a JSON file.
        
        Args:
            filename: Path to the file to load from
            
        Returns:
            A new CityGraph object
        """
        if not os.path.exists(filename):
            raise FileNotFoundError(f"Graph file {filename} not found")
        
        with open(filename, 'r') as f:
            graph_data = json.load(f)
        
        graph = cls()
        
        # Load nodes
        for node_id, node_data in graph_data["nodes"].items():
            node = CityNode(
                node_id=node_data["id"],
                lat=node_data["lat"],
                lng=node_data["lng"],
                name=node_data["name"]
            )
            graph.add_node(node)
        
        # Load edges
        for edge_data in graph_data["edges"]:
            graph.add_edge(
                node1_id=edge_data["from"],
                node2_id=edge_data["to"],
                distance=edge_data["distance"],
                time=edge_data["time"],
                bidirectional=False  # Don't create bidirectional edges when loading
            )
        
        return graph


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth.
    
    Args:
        lat1: Latitude of point 1 in degrees
        lon1: Longitude of point 1 in degrees
        lat2: Latitude of point 2 in degrees
        lon2: Longitude of point 2 in degrees
        
    Returns:
        Distance between the points in kilometers
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371  # Radius of Earth in kilometers
    return c * r


def create_demo_city_graph() -> CityGraph:
    """
    Create a demo city graph representing a small part of a city.
    
    Returns:
        A CityGraph object with demo data
    """
    graph = CityGraph()
    
    # Create nodes (intersections)
    # Using Bangalore coordinates as an example
    nodes = [
        CityNode("1", 12.9716, 77.5946, "Majestic"),
        CityNode("2", 12.9766, 77.5993, "Cubbon Park"),
        CityNode("3", 12.9719, 77.6062, "MG Road"),
        CityNode("4", 12.9647, 77.6039, "Richmond Circle"),
        CityNode("5", 12.9580, 77.5970, "Lalbagh"),
        CityNode("6", 12.9542, 77.6035, "Jayanagar"),
        CityNode("7", 12.9399, 77.6108, "BTM Layout"),
        CityNode("8", 12.9516, 77.6318, "Koramangala"),
        CityNode("9", 12.9626, 77.6371, "Indiranagar"),
        CityNode("10", 12.9784, 77.6408, "Ulsoor")
    ]
    
    for node in nodes:
        graph.add_node(node)
    
    # Create edges (roads)
    # Format: (node1_id, node2_id, distance_km, time_minutes)
    edges = [
        ("1", "2", 1.5, 8),   # Majestic to Cubbon Park
        ("2", "3", 1.2, 6),   # Cubbon Park to MG Road
        ("3", "4", 1.0, 5),   # MG Road to Richmond Circle
        ("4", "5", 1.8, 10),  # Richmond Circle to Lalbagh
        ("5", "6", 1.4, 7),   # Lalbagh to Jayanagar
        ("6", "7", 2.1, 12),  # Jayanagar to BTM Layout
        ("7", "8", 2.8, 15),  # BTM Layout to Koramangala
        ("8", "9", 1.9, 11),  # Koramangala to Indiranagar
        ("9", "10", 2.0, 12), # Indiranagar to Ulsoor
        ("10", "2", 2.2, 13), # Ulsoor to Cubbon Park
        ("3", "9", 3.0, 16),  # MG Road to Indiranagar
        ("4", "8", 2.5, 14),  # Richmond Circle to Koramangala
        ("5", "7", 2.7, 15),  # Lalbagh to BTM Layout
        ("1", "4", 1.6, 9)    # Majestic to Richmond Circle
    ]
    
    for edge in edges:
        graph.add_edge(edge[0], edge[1], edge[2], edge[3])
    
    return graph


if __name__ == "__main__":
    # Create a demo city graph
    city_graph = create_demo_city_graph()
    
    # Save the graph to a file
    graph_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'city_graph.json')
    os.makedirs(os.path.dirname(graph_file), exist_ok=True)
    city_graph.save_to_file(graph_file)
    
    print(f"Demo city graph created and saved to {graph_file}")
    
    # Output some stats
    print(f"Graph has {len(city_graph.get_nodes())} nodes and {sum(len(node.neighbors) for node in city_graph.get_nodes().values())} edges")
