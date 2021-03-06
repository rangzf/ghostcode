import './style.scss'
import { tabStore } from '#/stores'
import history from '#/history'
import { hScroll, isPostPage } from '#/utils'

$(function() {
  if (!isPostPage()) return

  let $postTabs = $('#J-post-tab')
  let $tabItems
  const $scrollWrap = $('.J-post-tab-scroller-wrap')
  const ndScrollWrap = $scrollWrap.get(0)
  const $iconClose = $scrollWrap.find('.icon-close')[0].outerHTML

  emitter.on('add-post-tab', post => {
    const tabs = tabStore.getTabs()
    if (!tabs.filter(tab => tab.id === post.id).length) {
      tabs.push({ ...post })

      tabStore.setTabs(tabs)
    }

    emitter.emit('tab-refresh', { ...post })
  })

  emitter.on('tab-refresh', (active = {}) => {
    const activeId = active.id
    const tabs = tabStore.getTabs()
    const currentTab = tabStore.currentTab
    const $active = $postTabs
      .html(
        tabs
          .map(
            tab =>
              `<div title="${tab.title}" class="J-tab-item light hover-opacity1 flex-item0 single-line item ${activeId === tab.id ? 'active' : ''}" data-id="${
                tab.id
              }">${tab.title}<i class="close J-post-tab-close lighter hover-opacity1" data-slug="${tab.slug}">${$iconClose}</i></div>`
          )
          .join('')
      )
      .find('.active')

    $tabItems = $postTabs.find('.J-tab-item')

    if (!currentTab) {
      tabStore.setCurrentTab({ ...active })
      history.replace(active.url, { ...active })
    } else {
      tabStore.setCurrentTab({ ...active })
      // not refetch current post
      if (currentTab.id !== activeId && !active.dontTouchHistory) {
        history.push(active.url, { ...active })
      }
    }

    scroll2view($active)
  })

  $postTabs
    .on('click', '.J-post-tab-close', function(e) {
      e.stopPropagation()
      tabStore.deleteTabItem(
        $(this)
          .parent('.J-tab-item')
          .data('id')
      )
    })
    .on('click', '.J-tab-item', function() {
      const $this = $(this)
      if ($this.is('.active')) return

      const id = $this.data('id')
      const currentTab = tabStore.getTabs().filter(tab => tab.id === id)[0] || {}

      $this
        .addClass('active')
        .siblings()
        .removeClass('active')
      tabStore.setCurrentTab(currentTab)
      history.push(currentTab.url, { ...currentTab })

      scroll2view($this)
    })

  /**
   * scroll selected tab item into view if it is out of view
   */
  function scroll2view($active) {
    // wrap element
    const wrapWidth = $scrollWrap.width()
    const wrapScrollLeft = $scrollWrap.scrollLeft()
    const wrapRight = wrapWidth + wrapScrollLeft
    const threshold = 10

    // active element
    const ndActive = $active.get(0)
    if (!ndActive) return
    const activeWidth = $active.outerWidth()
    const activeLeft = ndActive.offsetLeft
    const activeRight = activeLeft + activeWidth
    if (activeRight > wrapWidth + wrapScrollLeft) {
      ndScrollWrap.scrollLeft = activeRight - wrapWidth - threshold
    }
    if (activeLeft <= wrapScrollLeft) {
      ndScrollWrap.scrollLeft = activeLeft - threshold
    }
  }

  hScroll($scrollWrap.get(0))

  history.listen(location => {
    const nextTab = location.state
    if (!nextTab) {return}
    const $active = $tabItems
      .removeClass('active')
      .filter((idx, post) => {
        return $(post).data('id') === nextTab.id
      })
      .addClass('active')

    if ($active.length === 0) {
      emitter.emit('add-post-tab', { ...nextTab, dontTouchHistory: 1 })
    }

    scroll2view($active)
  })
})
