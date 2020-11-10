// create chart dimensions
const dimensions = {
  margin: {
    top: 40,
    right: 20,
    bottom: 50,
    left: 100,
  },
  chartWidth: 400,
  chartHeight: 500,
}
const graphWidth =
  dimensions.chartWidth - dimensions.margin.left - dimensions.margin.right
const graphHeight =
  dimensions.chartHeight - dimensions.margin.top - dimensions.margin.bottom

// draw canvas
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', dimensions.chartWidth)
  .attr('height', dimensions.chartHeight)

const graph = svg
  .append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .attr(
    'transform',
    `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
  )

// create scales
const x = d3.scaleTime().range([0, graphWidth])
const y = d3.scaleLinear().range([graphHeight, 0])

// create axes groups
const xAxisGroup = graph
  .append('g')
  .attr('class', 'x-axis')
  .attr('transform', `translate(0, ${graphHeight})`)
const yAxisGroup = graph.append('g').attr('class', 'y-axis')

// set up accessor functions
const xAccessor = (d) => new Date(d.date)
const yAccessor = (d) => d.distance

// d3 line path generator
const line = d3
  .line()
  .x((d) => x(xAccessor(d)))
  .y((d) => y(yAccessor(d)))

// line path element
const path = graph.append('path')

// create dotted line group
const dottedLines = graph.append('g').attr('opacity', 0)

// create dotted lines and append to dotted line group
xDotted = dottedLines
  .append('line')
  .attr('stroke-dasharray', '2px 4px')
  .attr('stroke', '#50503f')
yDotted = dottedLines
  .append('line')
  .attr('stroke-dasharray', '2px 4px')
  .attr('stroke', '#50503f')

const update = (data) => {
  data = data.filter((d) => d.activity === activity)
  // sort data based on date objects
  data.sort((a, b) => xAccessor(a) - xAccessor(b))

  // set scale domains
  x.domain(d3.extent(data, xAccessor))
  y.domain([0, d3.max(data, yAccessor)])

  // update path data
  path
    .data([data])
    .attr('fill', 'none')
    .attr('stroke', '#50503f')
    .attr('stroke-width', 2)
    .attr('d', line)

  // draw data
  const circles = graph.selectAll('circle').data(data)

  // remove unwanted points
  circles.exit().remove()

  // update current points
  circles.attr('cx', (d) => x(xAccessor(d))).attr('cy', (d) => y(yAccessor(d)))

  // add new points
  circles
    .enter()
    .append('circle')
    .attr('r', 4)
    .attr('cx', (d) => x(xAccessor(d)))
    .attr('cy', (d) => y(yAccessor(d)))
    .attr('fill', '#50503f')

  // add interactions
  graph
    .selectAll('circle')
    .on('mouseover', (e, d) => {
      d3.select(e.target)
        .transition()
        .duration(300)
        .attr('r', 8)
        .attr('fill', '#A06240')

      dottedLines.attr('opacity', 1)
      xDotted
        .attr('x1', 0)
        .attr('y1', y(yAccessor(d)))
        .attr('x2', x(xAccessor(d)))
        .attr('y2', y(yAccessor(d)))
      yDotted
        .attr('x1', x(xAccessor(d)))
        .attr('y1', y(yAccessor(d)))
        .attr('x2', x(xAccessor(d)))
        .attr('y2', graphHeight)
    })
    .on('mouseleave', (e, d) => {
      d3.select(e.target)
        .transition()
        .duration(300)
        .attr('r', 4)
        .attr('fill', '#50503f')

      dottedLines.attr('opacity', 0)
    })

  // create axes
  const xAxis = d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat('%b %d'))
  const yAxis = d3
    .axisLeft(y)
    .ticks(4)
    .tickFormat((d) => `${d} miles`)

  // call axes
  xAxisGroup.call(xAxis)
  yAxisGroup.call(yAxis)

  //rotate axis text
  xAxisGroup
    .selectAll('text')
    .attr('transform', `rotate(-40)`)
    .attr('text-anchor', 'end')
}

// access data
let data = []

db.collection('activities')
  .orderBy('date')
  .onSnapshot((res) => {
    res.docChanges().forEach((ch) => {
      const doc = { ...ch.doc.data(), id: ch.doc.id }

      switch (ch.type) {
        case 'added':
          data.push(doc)
          break
        case 'modified':
          const index = data.findIndex((it) => it.id === doc.id)
          data[index] = doc
          break
        case 'removed':
          data = data.filter((it) => it.id !== doc.id)
          break
        default:
          break
      }
    })

    update(data)
  })
