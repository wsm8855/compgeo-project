import sys
import numpy as np
import math

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

    def __repr__(self):
        return str(self.vertices)


class DelaunayTriangulation:
    def __init__(self, WIDTH, HEIGHT):
        self.triangulation = []
        self.SuperPointA = Point(-100, -100, -1)
        self.SuperPointB = Point(2 * WIDTH + 100, -100, -1)
        self.SuperPointC = Point(-100, 2 * HEIGHT + 100, -1)

        superTriangle = Triangle(self.SuperPointA, self.SuperPointB, self.SuperPointC)

        self.triangulation.append(superTriangle)

    def add_point(self, point):
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

    def __repr__(self):
        return "[" + str(self.triangulation) + ",[]]"


if __name__ == "__main__":
    points_str = sys.argv[1]
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

    delaunay.remove_super()

    print(delaunay)

    # print([[[1, 0, 3], [2, 1, 3], [4, 1, 0]], [[244, 125], [156, 300]]])
