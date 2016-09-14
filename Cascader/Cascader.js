import React, { Component, PropTypes } from 'react'

import _ from 'lodash/core'
import classNames from 'classnames'

import _debug from 'debug'
const debug = _debug('app:components:Cascader')

import styles from './Cascader.scss'

class CascaderMenu extends Component {
  handleClick = (selectedIndex) => {
    return () => {
      let { level, options } = this.props
      this.props.menuItemClickCallback(level, selectedIndex, options)
    }
  }

  render () {
    let { options, selectedIndex } = this.props

    return (
      <ul className={styles['cascader-menu']}>
        {options.map((it, index) => (
          <li key={index} onClick={this.handleClick(index)}
            className={classNames(styles['cascader-menu-item'], selectedIndex === index ? styles['active'] : '')} >
            {it.label}
          </li>
        ))}
      </ul>
    )
  }
}

CascaderMenu.propTypes = {
  level: PropTypes.number,
  selectedIndex: PropTypes.number,
  options: PropTypes.array,
  menuItemClickCallback: PropTypes.func
}

class Cascader extends Component {
  constructor (props) {
    super(props)

    this.getValuesOptions = this.getValuesOptions.bind(this)

    this.state = {
      menuArray: [],
      menuOpen: false,
      isValueSet: false,
      valuesOptions: []
    }
  }

  handleCascaderMenuClick = (level, selectedIndex, options) => {
    if (!options || options.length === 0) return

    let { menuArray } = this.state
    let menuArrayClone = []
    menuArray.map(it => menuArrayClone.push(_.clone(it)))
    menuArray = []

    for (let i = 0; i <= level; i++) {
      menuArray.push({
        level: menuArrayClone[i].level,
        selectedIndex: level === i ? selectedIndex : menuArrayClone[i].selectedIndex,
        options: menuArrayClone[i].options
      })
    }

    let childLevel = level + 1
    let childSelectedIndex = -1
    let childOptions = options[selectedIndex].children

    if (childOptions && childOptions.length > 0) {
      let childMenuMap = { level: childLevel, selectedIndex: childSelectedIndex, options: childOptions }

      menuArray.push(childMenuMap)
      this.setState({ 'menuArray': menuArray })
    } else {
      this.setState({ 'menuArray': menuArray, isValueSet: true, menuOpen: false })
      let selectedOptions = []
      for (let menu of menuArray) {
        selectedOptions.push(menu.options[menu.selectedIndex])
      }
      this.setState({ 'valuesOptions': selectedOptions })
      let { onChange } = this.props
      if (onChange) onChange(options[selectedIndex].value)
    }
  }

  handleCascaderPickerClick = () => {
    let { menuArray, menuOpen } = this.state
    let { options } = this.props
    if (menuArray.length === 0) {
      let menuMap = {level: 0, selectedIndex: -1, options}
      menuArray.push(menuMap)
      this.setState({'menuArray': menuArray})
    }
    this.setState({ menuOpen: !menuOpen })
  }

  getValuesOptions = (options, values) => {
    let valuesOptions = []
    if (!options || options.length === 0 || !values || values.length === 0) return valuesOptions
    let valueOption = options.find(it => it.value === values[0])
    let restValues = values.slice(1)

    if (valueOption) valuesOptions.push(valueOption)

    if (valueOption && valueOption.children && valueOption.children.length > 0 && restValues.length > 0) {
      valuesOptions.push(...this.getValuesOptions(valueOption.children, restValues))
    }
    return valuesOptions
  }

  render () {
    let { placeholder, width, height, hasError } = this.props
    let { menuArray, menuOpen, isValueSet } = this.state
    let pickerLabelStyle = classNames({
      'fa': true,
      'fa-angle-down': !menuOpen,
      'fa-angle-up': menuOpen
    }, styles['picker-arrow'])

    let valuesOptions = this.state.valuesOptions

    return (
      <div>
        <div className={styles['cascader-picker']} onClick={this.handleCascaderPickerClick}>
          <div className={styles['input-wrapper']} style={{ width: width || 160 }}>
            <input type='text' readOnly placeholder={!isValueSet && !(valuesOptions && valuesOptions.length > 0) ? placeholder : ''}
              className={hasError ? 'form-control error' : ''} style={{ height: height || 30 }} />
          </div>
          <div className={styles['picker-label']}>
            {isValueSet
            ? menuArray.map((it, index) => (
              <div key={index}>{it.selectedIndex >= 0 ? it.options[it.selectedIndex].label : '' }
                {index < menuArray.length - 1 ? <span>|</span> : null}
              </div>))
            : valuesOptions.map((it, index) => (
              <div key={index}>{it.label}
                {index < valuesOptions.length - 1 ? <span>|</span> : null}
              </div>))
            }
          </div>
          <i className={pickerLabelStyle} />
        </div>
        {menuOpen
        ? <div className={styles['cascader-menus']}>
          {menuArray.map((it, index) => (
            <CascaderMenu key={index} {...{
              level: it.level,
              selectedIndex: it.selectedIndex,
              options: it.options,
              menuItemClickCallback: this.handleCascaderMenuClick
            }} />
          ))}
        </div>
          : null
        }
      </div>
    )
  }

  handleComponentUpdate (props, firstRun) {
    let { options, values } = props

    if (!options || !values || options.length === 0 || values.length === 0) return

    let valuesOptions = this.getValuesOptions(options, values)
    debug('---- handleComponentUpdate trigger by %s', firstRun ? 'componentDidMount' : 'componentWillReceiveProps')
    this.setState({ valuesOptions })
  }

  componentWillReceiveProps (nextProps) {
    this.handleComponentUpdate(nextProps, false)
  }

  componentDidMount () {
    this.handleComponentUpdate(this.props, true)
  }
}

Cascader.propTypes = {
  placeholder: PropTypes.string,
  options: PropTypes.array.isRequired,
  values: PropTypes.array,
  value: PropTypes.any,
  onChange: PropTypes.func,            // function (value)
  // style props
  width: PropTypes.number,
  height: PropTypes.number,
  hasError: PropTypes.bool
}

export default Cascader
