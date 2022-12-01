import sys
import numpy as np
import math
import json

WIDTH = 1000
HEIGHT = 1000


class Point:
    def __init__(self, x, y, name):
        self.x = x
        self.y = y
        self.name = name

    def InCircum(self, triangle):
        a = triangle.vertices[0]
        b = triangle.vertices[1]
        c = triangle.vertices[2]
        circle = np.array([[a.x - self.x, a.y - self.y, (a.x - self.x) ** 2 + (a.y - self.y) ** 2],
                           [b.x - self.x, b.y - self.y, (b.x - self.x) ** 2 + (b.y - self.y) ** 2],
                           [c.x - self.x, c.y - self.y, (c.x - self.x) ** 2 + (c.y - self.y) ** 2]])

        if np.linalg.det(circle) > 0:
            return True
        else:
            return False

    def __repr__(self):
        return str(self.name)

    def equals(self, other):
        return self.x == other.x and self.y == other.y

    def str_loc(self):
        return "[" + str(self.x) + ", "  + str(self.y) +"]"


class Segment:
    def __init__(self, start, end):
        self.start = start
        self.end = end

    def __eq__(self, __o: object) -> bool:
        if self.start == __o.start and self.end == __o.end:
            return True
        if self.start == __o.end and self.end == __o.start:
            return True
        return False

    def length(self):
        return math.sqrt(math.pow(self.start.x - self.end.x, 2) + math.pow(self.start.y - self.end.y, 2))

    def encroached_upon(self, point):
        if self.in_segment(point):
            return False
        radius = self.length() * .5
        mid_x = (self.start.x + self.end.x) / 2
        mid_y = (self.start.y + self.end.y) / 2
        diff_from_point = math.sqrt(math.pow(point.x - mid_x, 2) + math.pow(point.y - mid_y, 2))
        return diff_from_point < radius

    def in_segment(self, point):
        return point == self.start or point == self.end

    def get_midpoint(self):
        return [(self.start.x + self.end.x) / 2, (self.start.y + self.end.y) / 2]


class Triangle:
    def __init__(self, a, b, c):
        self.vertices = [a, b, c]
        self.edges = [Segment(a, b), Segment(b, c), Segment(c, a)]

    def shares_edge(self, other_edge):
        for edge in self.edges:
            if edge == other_edge:
                return True
        return False

    def has_vertex(self, vert):
        if vert in self.vertices:
            return True
        return False

    def get_angle(self, a, b, c):
        ang = math.degrees(math.atan2(c.y-b.y, c.x-b.x) - math.atan2(a.y-b.y, a.x-b.x))
        return ang + 180 if ang < 0 else ang

    def is_skinny(self, threshold_angle, threshold_length):
        too_small = True
        for edge in self.edges:
            if edge.length() > threshold_length:
                too_small = False
        if too_small:
            return False

        a = self.vertices[0]
        b = self.vertices[1]
        c = self.vertices[2]

        if self.get_angle(a, b, c)< threshold_angle:
            return True
        if self.get_angle(b, a, c) < threshold_angle:
            return True
        if self.get_angle(c, a, b) < threshold_angle:
            return True
        return False

    def get_circumcenter(self):
        a = self.vertices[0]
        b = self.vertices[1]
        c = self.vertices[2]
        d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
        ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d
        uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d
        return (ux, uy)

    def __repr__(self):
        return str(self.vertices)


class DelaunayTriangulation:
    def __init__(self, WIDTH, HEIGHT):
        self.triangulation = []
        self.new_points = []
        self.all_points = []
        self.SuperPointA = Point(-100, -100, -1)
        self.SuperPointB = Point(2 * WIDTH + 100, -100, -1)
        self.SuperPointC = Point(-100, 2 * HEIGHT + 100, -1)
        self.threshold_angle = 0
        self.threshold_length = 0
        self.next_point_name = 0

        superTriangle = Triangle(self.SuperPointA, self.SuperPointB, self.SuperPointC)

        self.triangulation.append(superTriangle)

    def add_point(self, point, new = False):
        self.next_point_name += 1
        if new == True:
            self.new_points.append(point)
        self.all_points.append(point)
        bad_triangles = []
        for triangle in self.triangulation:
            if point.InCircum(triangle):
                bad_triangles.append(triangle)
        polygon = []
        for triangle in bad_triangles:
            for edge in triangle.edges:
                isNeighbor = False
                for other_triangle in bad_triangles:
                    if not isNeighbor:
                        if triangle != other_triangle:
                            if other_triangle.shares_edge(edge):
                                isNeighbor = True
                if not isNeighbor:
                    polygon.append(edge)
        for triangle in bad_triangles:
            self.triangulation.remove(triangle)

        for edge in polygon:
            new_triangle = Triangle(edge.start, edge.end, point)
            self.triangulation.append(new_triangle)

    def remove_super(self):
        onSuper = lambda triangle: triangle.has_vertex(self.SuperPointA) or triangle.has_vertex(
            self.SuperPointB) or triangle.has_vertex(self.SuperPointC)

        for triangle_new in self.triangulation[:]:
            if onSuper(triangle_new):
                self.triangulation.remove(triangle_new)

    def get_skinny(self):
        for triangle in self.triangulation:
            #make sure it's not the super triangle
            if(not triangle.has_vertex(self.SuperPointA) and not triangle.has_vertex(self.SuperPointB) and not triangle.has_vertex(self.SuperPointC)):
                if triangle.is_skinny(self.threshold_angle, self.threshold_length):
                    return triangle
        else:
            return None

    def find_and_split_segments(self):
        for triangle in self.triangulation:
            if (not triangle.has_vertex(self.SuperPointA) and not triangle.has_vertex(
                    self.SuperPointB) and not triangle.has_vertex(self.SuperPointC)):
                for segment in triangle.edges:
                    if segment.length() > self.threshold_length:
                        for point in self.all_points:
                            if(segment.encroached_upon(point)):
                                x, y = segment.get_midpoint()
                                p = Point(x, y, self.next_point_name)
                                delaunay.add_point(p, new=True)
                                return True
        return False

    def refine(self):
        encroached_segs = True
        while(encroached_segs):
            encroached_segs = self.find_and_split_segments()
        skinny = self.get_skinny()
        if skinny is not None:
            x,y = skinny.get_circumcenter()
            p = Point(x, y, self.next_point_name)
            segments = []
            for triangle in self.triangulation:
                if (not triangle.has_vertex(self.SuperPointA) and not triangle.has_vertex(
                        self.SuperPointB) and not triangle.has_vertex(self.SuperPointC)):
                    for segment in triangle.edges:
                        if not segment.length() < self.threshold_length:
                            if(segment.encroached_upon(point)):
                                segments.append(segment)
            if len(segments)>0:
                for segment in segments:
                    x, y = segment.get_midpoint()
                    p = Point(x, y, self.next_point_name)
                    delaunay.add_point(p, new=True)
            else:
                delaunay.add_point(p, new=True)


    def ruppert(self, threshold_angle, threshold_length):
        self.threshold_angle = threshold_angle
        self.threshold_length = threshold_length
        while(self.get_skinny() is not None):
            self.refine()

    def __repr__(self):
        new_points_str = "["
        if(len(self.new_points)>0):
            for point in self.new_points:
                new_points_str+= point.str_loc() +", "
            new_points_str = new_points_str[:len(new_points_str)-2]
        new_points_str +="]"
        return "[" + str(self.triangulation) + ", " +new_points_str+ "]"

if __name__ == "__main__":
    points_str = sys.argv[1]
    refine = int(sys.argv[2])
    points_raw = [int(i) for i in points_str.split(",")]

    points = [None] * (int(len(points_raw) / 2))
    delaunay = DelaunayTriangulation(WIDTH, HEIGHT)
    index = 0
    name = 0
    while index < len(points_raw):
        point = Point(points_raw[index], points_raw[index + 1], name)
        delaunay.add_point(point)
        points.append(point)
        index += 2
        name += 1

    if refine:
        # triangulate with refinement
        angle = float(sys.argv[3])
        delaunay.ruppert(angle, 50)
        delaunay.remove_super()
        print(delaunay)
    else:
        delaunay.remove_super()
        print(delaunay)

