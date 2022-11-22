import sys

if __name__ == "__main__":
    points_str = sys.argv[1]
    points = [int(i) for i in points_str.split(",")]

    # do processing to determine order of points to connect [4, 1, 0, 4, 3, 1, 4, 2, 3]
    print([1, 0, 2])