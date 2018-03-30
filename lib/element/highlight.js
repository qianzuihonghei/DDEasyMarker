import BaseElement from './base'
import TextNode from '../text_node'
import { getTouchPosition, inRectangle, anyToPx } from '../helpers'
/**
 * Highlight
 *
 * @export
 * @class Highlight
 * @extends {BaseElement}
 */
export default class Highlight extends BaseElement {
  constructor(container, option) {
    super()
    const defaultOptions = {
      color: 'FEFFCA',
      opacity: 1,
      padding: '0.1rem',
    }
    this.container = container
    this.option = Object.assign(defaultOptions, option)
    this.option.padding = anyToPx(this.option.padding)
    this.lineMap = new Map()
    this.onClick = () => { }
    this.createElement()
    this.mount()
    this.id = 0
  }

  getID() {
    return this.id++
  }

  /**
   *
   *
   * @param {Selection} selection
   * @param {any} id
   * @param {any} meta
   * @param {Object} offset
   * @param {number} offset.x
   * @param {number} offset.y
   * @memberof Highlight
   */
  highlight(selection, id, meta = {}, offset) {
    const lineID = id === undefined || id === null ? this.getID() : id
    const startTextNode = new TextNode(selection.anchorNode, selection.anchorOffset)
    const endTextNode = new TextNode(selection.focusNode, selection.focusOffset)
    const { rects } = TextNode.getSelectNodeRectAndText(
      startTextNode.node,
      endTextNode.node,
      startTextNode.offset,
      endTextNode.offset
    )
    const points = rects.map(rect =>
      this.rectToPointArray(rect, offset)
        .reduce((acc, [x, y]) => `${acc} ${x},${y}`, ''))
    this.lineMap.set(lineID, {
      selection, points, rects, meta,
    })
    return lineID
  }

  render() {
    this.removeAllRectangle()
    this.lineMap.forEach((line) => {
      line.points.forEach((points) => {
        this.element.appendChild(this.createRectangle(points))
      })
    })
  }

  /**
   *
   *
   * @param {Object[]} lines
   * @param {Selection} lines[].selection
   * @param {any} [lines[].id]
   * @param {any} [lines[].meta]
   * @memberof Highlight
   */
  highlightLines(lines, offset) {
    this.lineMap.clear()
    const ids = lines.map(({ selection, id, meta }) => this.highlight(selection, id, meta, offset))
    this.render()
    return ids
  }

  /**
   *
   *
   * @param {Selection} selection
   * @param {*} id
   * @param {*} meta
   * @param {Object} offset
   * @memberof Highlight
   */
  highlightLine(selection, id, meta, offset) {
    const lineID = this.highlight(selection, id, meta, offset)
    this.render()
    return lineID
  }

  /**
   *
   *
   * @param {any} id
   * @returns {boolean}
   * @memberof Highlight
   */
  cancelHighlightLine(id) {
    this.lineMap.delete(id)
    this.render()
  }

  createElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const { width, height } = window.getComputedStyle(this.container)
    svg.style.zIndex = '1'
    svg.style.width = width
    svg.style.height = height
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.overflow = 'visible'
    this.element = svg
  }

  createRectangle(points) {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.style.fill = this.option.color
    polygon.style.strokeWidth = 0
    polygon.style.strokeOpacity = this.option.opacity
    polygon.style.opacity = this.option.opacity
    polygon.setAttribute('points', points)
    return polygon
  }

  handleTap(e) {
    const { x, y } = getTouchPosition(e)
    let clickLine
    this.lineMap.forEach((line, id) => {
      for (let i = 0; i < line.rects.length; i++) {
        const rect = line.rects[i]
        if (inRectangle(x, y, rect)) {
          clickLine = { id, line }
          break
        }
      }
    })
    if (clickLine) {
      this.onClick(clickLine.id, clickLine.line.meta, clickLine.line.selection)
      return true
    }
    return false
  }

  removeAllRectangle() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild)
    }
  }
  /**
   *
   *
   * @static
   * @param {ClientRect} rect
   * @param {Object} offset
   * @param {number} offset.x
   * @param {number} offset.y
   * @memberof Highlight
   */
  rectToPointArray(rect, offset) {
    const points = []
    if (rect.width === 0) return points

    points.push([rect.left - this.option.padding, rect.top - this.option.padding])
    points.push([rect.right + this.option.padding, rect.top - this.option.padding])
    points.push([rect.right + this.option.padding, rect.bottom + this.option.padding])
    points.push([rect.left - this.option.padding, rect.bottom + this.option.padding])

    points.forEach((point) => {
      point[0] -= offset.x
      point[1] -= offset.y
    })
    return points
  }
}
