
var nNodes = 10;

var edges = [
    {start: 0, end: 1},
    {start: 0, end: 9},
    {start: 1, end: 2},
    {start: 2, end: 3},
    {start: 3, end: 4},
    {start: 3, end: 5},
    {start: 3, end: 6},
    {start: 3, end: 7},
    {start: 7, end: 8}
];

var width   = 500,
    height  = 500,
    radius  = 20;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const circles = d3.range(nNodes).map(i => ({
    x: Math.random() * (width - radius * 2) + radius,
    y: Math.random() * (height - radius * 2) + radius,
}));

function updateLine(line) {
    lines = edges.map(e => ({
        x1: circles[e.start].x,
        y1: circles[e.start].y,
        x2: circles[e.end].x,
        y2: circles[e.end].y,
    }));

    return line
        .data(lines)
        .join("line")
        .attr("x1", d => d.x1)
        .attr("y1", d => d.y1)
        .attr("x2", d => d.x2)
        .attr("y2", d => d.y2)
        .style("stroke", "darkgray")
        .style("stroke-width", 4);
}

var line = svg.append("g").selectAll("line");
line = updateLine(line);

function getDarkColor(color) {
    var color = d3.color(color);
    color.r /= 1.3; color.g /= 1.3; color.b /= 1.3;
    return color.formatHex()
}

function dragStarted(event, d) {
    var newColor = getDarkColor(d3.select(this).attr("fill"));
    d3.select(this)
        .style("stroke", newColor)
        .style("stroke-width", 4);
}

function dragged(event, d) {
    d3.select(this)
        .attr("cx", d.x = event.x)
        .attr("cy", d.y = event.y);
    line = updateLine(line);
}

function dragEnded(event, d) {
    d3.select(this)
        .style("stroke", null)
        .style("stroke-width", null);
    line = updateLine(line);
}

drag = d3.drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded);

var circle = svg.append("g")
    .selectAll("circle")
    .data(circles)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", radius)
    .attr("fill", (d, i) => d3.schemeCategory10[i % 10])
    .call(drag);