import Delaunator from 'https://cdn.skypack.dev/delaunator@5.0.0'; // https://github.com/mapbox/delaunator

export function delaunay_triangulate(points) {
    // const coords = [168,180, 168,178, 168,179, 168,181, 168,183, ...];

    // points to expected format
    const coords = [];
    points.forEach((p) => {coords.push(p.x); coords.push(p.y)});

    // perform triangulation
    const delaunay = new Delaunator(coords);
    return delaunay.triangles;
    // [623, 636, 619,  636, 444, 619, ...]
}