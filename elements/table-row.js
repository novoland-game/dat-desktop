var microcomponent = require('microcomponent')
var encoding = require('dat-encoding')
var bytes = require('prettier-bytes')
var html = require('choo/html')
var css = require('sheetify')

var TitleField = require('./table-title-field')
var button = require('./button')
var status = require('./status')
var icon = require('./icon')

var cellStyles = css`
  :host {
    .cell-1 {
      width: 4rem;
    }
    .cell-2 {
      width: 17rem;
    }
    .cell-3 {
      width: 15rem;
    }
    .cell-4 {
      width: 5.5rem;
      white-space: nowrap;
    }
    .cell-5 {
      width: 6rem;
    }
    .cell-6 {
      width: 10.25rem;
    }
    .cell-truncate {
      width: 26vw;
    }
  }
`

var iconStyles = css`
  :host {
    .row-action {
      height: 1.5rem;
      display: inline-block;
      color: var(--color-neutral-20);
      svg {
        vertical-align: middle;
        width: 1.1em;
        max-height: 1.6em;
      }
      &:hover,
      &:focus {
        outline: none;
        color: var(--color-neutral-50);
      }
      &:first-child {
        padding-left: 0;
      }
      &:last-child {
        padding-right: 0;
      }
    }
    .icon-network {
      display: inline-block;
      color: var(--color-neutral-20);
      vertical-align: sub;
      width: 1em;
      svg {
        border: 1px solid red;
      }
      svg polygon {
        fill: inherit;
      }
    }
  }
`

var networkStyles = css`
  :host {
    svg {
      height: 1.5rem;
      display: inline-block;
      color: var(--color-neutral-20);
      vertical-align: middle;
      width: 1.1em;
      max-height: 1.6em;
    }
    .network-peers-many {
      --polygon-1-color: var(--color-green);
      --polygon-2-color: var(--color-green);
      --polygon-3-color: var(--color-green);
    }
    .network-peers-1 {
      --polygon-1-color: var(--color-yellow);
      --polygon-2-color: var(--color-yellow);
    }
    .network-peers-0 {
      --polygon-1-color: var(--color-red);
    }
  }
`

module.exports = Row

function Row ({ highlight }) {
  var hexContent = HexContent()
  var finderButton = FinderButton()
  var linkButton = LinkButton()
  var deleteButton = DeleteButton()
  var titleField = TitleField()
  var networkIcon = NetworkIcon()

  var component = microcomponent({ name: 'table-row' })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var { dat, state, emit } = this.props
    if (dat instanceof Error) return errorRow(dat)

    var stats = dat.stats
    var peers = dat.network ? dat.network.connected : 'N/A'
    var key = encoding.encode(dat.key)
    var styles = cellStyles
    if (highlight) styles += ' fade-highlight'

    stats.size = dat.archive.content
      ? bytes(dat.archive.content.byteLength)
      : 'N/A'
    stats.state = !dat.network
      ? 'paused'
      : dat.writable || dat.progress === 1
        ? 'complete'
        : peers
          ? 'loading'
          : 'stale'

    return html`
      <tr id=${key} class=${styles}>
        <td class="cell-1">
          <div class="w2 center">
            ${hexContent.render({ dat, stats, emit })}
          </div>
        </td>
        <td class="cell-2">
          <div class="cell-truncate">
            ${titleField.render({ dat, state, emit })}
            <p class="f7 color-neutral-60 truncate">
              <span class="author">${dat.metadata.author || 'Anonymous'} • </span>
              <span class="title">
                ${dat.writable ? 'Read & Write' : 'Read-only'}
              </span>
            </p>
          </div>
        </td>
        <td class="cell-3">
          ${status(dat, stats)}
        </td>
        <td class="tr cell-4 size">
          ${stats.size}
        </td>
        <td class="cell-5 ${networkStyles}">
          ${networkIcon.render({ dat, emit })}
          <span class="network">${peers}</span>
        </td>
        <td class="cell-6">
          <div class="flex justify-end ${iconStyles}">
            ${finderButton.render({ dat, emit })}
            ${linkButton.render({ dat, emit })}
            ${deleteButton.render({ dat, emit })}
          </div>
        </td>
      </tr>
    `
  }

  function update (props) {
    return true
  }
}

function FinderButton () {
  var component = microcomponent({ name: 'finder-button' })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var { dat, emit } = this.props
    return button.icon('Open in Finder', {
      icon: icon('open-in-finder'),
      class: 'row-action',
      onclick: function (e) {
        e.preventDefault()
        e.stopPropagation()
        emit('dats:open', dat)
      }
    })
  }

  function update () {
    return false
  }
}

function LinkButton () {
  var component = microcomponent({ name: 'link-button' })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var { dat, emit } = this.props
    return button.icon('Share Dat', {
      icon: icon('link'),
      class: 'row-action',
      onclick: function (e) {
        e.preventDefault()
        e.stopPropagation()
        emit('dats:share', dat)
      }
    })
  }

  function update () {
    return false
  }
}

function DeleteButton () {
  var component = microcomponent({ name: 'delete-button' })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var { dat, emit } = this.props
    return button.icon('Remove Dat', {
      icon: icon('delete'),
      class: 'row-action delete',
      onclick: function (e) {
        e.preventDefault()
        e.stopPropagation()
        emit('dats:remove', { key: dat.key })
      }
    })
  }

  function update () {
    return false
  }
}

function NetworkIcon () {
  var component = microcomponent({
    name: 'network-icon',
    state: {
      peerCount: 0
    }
  })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var { dat } = this.props
    var peerCount = this.state.peerCount = dat.network
      ? dat.network.connected
      : 0
    var iconClass = peerCount === 0
      ? 'network-peers-0'
      : peerCount === 1
        ? 'network-peers-1'
        : 'network-peers-many'

    return icon('network', { class: iconClass })
  }

  function update ({ dat, emit }) {
    var newPeerCount = dat.network ? dat.network.connected : 0
    return this.state.peerCount !== newPeerCount
  }
}

// create a new hexcontent icon
function HexContent () {
  var component = microcomponent({ name: 'hex-content' })
  component.on('render', render)
  component.on('update', update)
  return component

  function render () {
    var state = this.state.state = this.props.stats.state
    var { emit, dat } = this.props

    if (state === 'loading') {
      return button.icon('loading', {
        icon: icon('hexagon-down', {class: 'w2'}),
        class: 'color-blue hover-color-blue-hover',
        onclick: togglePause
      })
    } else if (state === 'paused') {
      return button.icon('paused', {
        icon: icon('hexagon-resume', {class: 'w2'}),
        class: 'color-neutral-30 hover-color-neutral-40',
        onclick: togglePause
      })
    } else if (state === 'complete') {
      return button.icon('complete', {
        icon: icon('hexagon-up', {class: 'w2'}),
        class: 'color-green hover-color-green-hover',
        onclick: togglePause
      })
    } else {
      return button.icon('stale', {
        icon: icon('hexagon-x', {class: 'w2'}),
        class: 'color-neutral-30 hover-color-neutral-40',
        onclick: togglePause
      })
    }

    function togglePause (e) {
      e.preventDefault()
      e.stopPropagation()
      emit('dats:toggle-pause', dat)
    }
  }

  function update ({ dat, stats, emit }) {
    return stats.state !== this.state.state
  }
}

function errorRow (err) {
  var errorHexIcon = icon('hexagon-down', {
    class: 'w2 color-red'
  })
  return html`
    <tr>
      <td class="cell-1">
        <div class="w2 center">
          ${errorHexIcon}
        </div>
      </td>
      <td class="cell-2" colspan="4">
        <div class="cell-truncate color-red">
          <h2 class="f6 normal">
            Error
          </h2>
          <p class="f7">
            Could not share ${err.dir}
          </p>
        </div>
      </td>
      <td class="cell-6">
      </td>
    </tr>
  `
}