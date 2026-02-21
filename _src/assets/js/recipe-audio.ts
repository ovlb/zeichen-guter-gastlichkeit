import { SR_ONLY_STYLES } from './lib/constants.js'

const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><polygon points="4,2 18,10 4,18"/></svg>`
const PAUSE_ICON = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><rect x="3" y="2" width="5" height="16" rx="1"/><rect x="12" y="2" width="5" height="16" rx="1"/></svg>`

const SEEK_STEP = 5
const SEEK_PAGE_FACTOR = 0.1

const styles = /* css */ `
  :host {
    --_btn-size: 2.75rem;
    --_thumb-size: 0.875rem;
    --_track-block-size: 0.375rem;

    display: block;
    font-family: inherit;
  }

  .player {
    align-items: center;
    color: var(--text-1);
    display: flex;
    gap: var(--space-2xs, 0.5rem);
    margin-inline: auto;
    max-inline-size: 24rem;
    padding: var(--space-3xs, 0.25rem) var(--space-xs, 0.75rem);
  }

  .play-btn {
    align-items: center;
    background: transparent;
    block-size: var(--_btn-size);
    border: none;
    border-radius: 50%;
    color: inherit;
    cursor: pointer;
    display: flex;
    flex-shrink: 0;
    inline-size: var(--_btn-size);
    justify-content: center;
    transition: background-color 0.15s var(--ease-3, ease);
  }

  .play-btn:hover {
    background: color-mix(in srgb, var(--text-1) 8%, transparent);
  }

  .play-btn:focus-visible {
    outline: var(--border-size-2, 2px) solid var(--text-1);
    outline-offset: var(--border-size-2, 2px);
  }

  .time {
    font-size: var(--u-font-size--1);
    font-variant-numeric: oldstyle-nums tabular-nums;
    min-inline-size: 3.5ch;
    user-select: none;
  }

  .time--current {
    text-align: end;
  }

  .time--duration {
    text-align: start;
  }

  .progress {
    cursor: pointer;
    flex: 1;
    padding-block: calc((var(--_btn-size) - var(--_track-block-size)) / 2);
    touch-action: none;
  }

  .progress:focus-visible {
    outline: none;
  }

  .progress:focus-visible .progress-track {
    outline: var(--border-size-2, 2px) solid var(--text-1);
    outline-offset: var(--size-1, 0.25rem);
  }

  .progress-track {
    background: color-mix(in srgb, var(--text-1) 15%, transparent);
    block-size: var(--_track-block-size);
    border-radius: calc(var(--_track-block-size) / 2);
    position: relative;
  }

  .progress-fill {
    background: var(--link);
    block-size: 100%;
    border-radius: inherit;
    inline-size: 0%;
    transition: inline-size 0.1s linear;
  }

  .progress-thumb {
    background: var(--text-1);
    block-size: var(--_thumb-size);
    border: var(--border-size-2, 2px) solid var(--accent);
    border-radius: 50%;
    inline-size: var(--_thumb-size);
    inset-block-start: 50%;
    inset-inline-start: 0%;
    opacity: 0;
    position: absolute;
    transform: translate(-50%, -50%);
    transition: opacity 0.15s var(--ease-3, ease), scale 0.1s var(--ease-3, ease);
  }

  .progress:hover .progress-thumb,
  .progress:focus-visible .progress-thumb,
  .player--dragging .progress-thumb {
    opacity: 1;
  }

  .progress:active .progress-thumb,
  .player--dragging .progress-thumb {
    scale: 1.2;
  }

  ${SR_ONLY_STYLES}
`

class RecipeAudio extends HTMLElement {
  private shadow: ShadowRoot
  private audio: HTMLAudioElement

  private playButton!: HTMLButtonElement
  private progressContainer!: HTMLDivElement
  private progressTrack!: HTMLDivElement
  private progressFill!: HTMLDivElement
  private progressThumb!: HTMLDivElement
  private currentTimeEl!: HTMLSpanElement
  private durationEl!: HTMLSpanElement
  private liveRegion!: HTMLDivElement
  private playerEl!: HTMLDivElement

  private isPlaying = false
  private isDragging = false
  private duration = 0

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.audio = new Audio()
  }

  connectedCallback(): void {
    const fallback = this.querySelector('audio')
    if (fallback) {
      fallback.style.display = 'none'
    }

    const src = this.getAttribute('src') ?? ''
    if (!src) return

    this.audio.src = src
    this.audio.preload = 'metadata'

    this.shadow.innerHTML = `
      <style>${styles}</style>
      <div class="player" role="group" aria-label="Audioplayer">
        <button class="play-btn" type="button" aria-label="Wiedergabe">
          ${PLAY_ICON}
        </button>
        <span class="time time--current" aria-hidden="true">0:00</span>
        <div class="progress" role="slider"
             aria-label="Wiedergabefortschritt"
             aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"
             aria-valuetext="0 Sekunden von 0 Sekunden"
             tabindex="0">
          <div class="progress-track">
            <div class="progress-fill"></div>
            <div class="progress-thumb"></div>
          </div>
        </div>
        <span class="time time--duration" aria-hidden="true">0:00</span>
        <div class="sr-only" aria-live="polite"></div>
      </div>
    `

    this.playButton = this.shadow.querySelector(
      '.play-btn',
    ) as HTMLButtonElement
    this.progressContainer = this.shadow.querySelector(
      '.progress',
    ) as HTMLDivElement
    this.progressTrack = this.shadow.querySelector(
      '.progress-track',
    ) as HTMLDivElement
    this.progressFill = this.shadow.querySelector(
      '.progress-fill',
    ) as HTMLDivElement
    this.progressThumb = this.shadow.querySelector(
      '.progress-thumb',
    ) as HTMLDivElement
    this.currentTimeEl = this.shadow.querySelector(
      '.time--current',
    ) as HTMLSpanElement
    this.durationEl = this.shadow.querySelector(
      '.time--duration',
    ) as HTMLSpanElement
    this.liveRegion = this.shadow.querySelector('[aria-live]') as HTMLDivElement
    this.playerEl = this.shadow.querySelector('.player') as HTMLDivElement

    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate)
    this.audio.addEventListener('ended', this.handleEnded)
    this.audio.addEventListener('play', this.handlePlay)
    this.audio.addEventListener('pause', this.handlePause)

    this.playButton.addEventListener('click', this.handlePlayPause)
    this.progressContainer.addEventListener(
      'pointerdown',
      this.handleProgressPointerDown,
    )
    this.progressContainer.addEventListener(
      'keydown',
      this.handleProgressKeydown,
    )

    if (Number.isFinite(this.audio.duration)) {
      this.handleLoadedMetadata()
    }
  }

  disconnectedCallback(): void {
    this.audio.pause()
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate)
    this.audio.removeEventListener('ended', this.handleEnded)
    this.audio.removeEventListener('play', this.handlePlay)
    this.audio.removeEventListener('pause', this.handlePause)

    if (this.isDragging) {
      this.isDragging = false
      this.progressContainer?.removeEventListener(
        'pointermove',
        this.handleProgressPointerMove,
      )
      this.progressContainer?.removeEventListener(
        'pointerup',
        this.handleProgressPointerUp,
      )
    }
  }

  private handleLoadedMetadata = (): void => {
    this.duration = this.audio.duration
    this.durationEl.textContent = this.formatTime(this.duration)
    this.updateSliderAria()
  }

  private handleTimeUpdate = (): void => {
    if (this.isDragging) return
    this.updateProgress()
  }

  private handleEnded = (): void => {
    this.isPlaying = false
    this.playButton.innerHTML = PLAY_ICON
    this.playButton.setAttribute('aria-label', 'Wiedergabe')
    this.audio.currentTime = 0
    this.updateProgress()
    this.announce('Wiedergabe beendet')
  }

  private handlePlay = (): void => {
    this.isPlaying = true
    this.playButton.innerHTML = PAUSE_ICON
    this.playButton.setAttribute('aria-label', 'Pause')
    this.announce('Wiedergabe gestartet')
  }

  private handlePause = (): void => {
    if (this.audio.ended) return
    this.isPlaying = false
    this.playButton.innerHTML = PLAY_ICON
    this.playButton.setAttribute('aria-label', 'Wiedergabe')
    this.announce('Wiedergabe pausiert')
  }

  private handlePlayPause = (): void => {
    if (this.isPlaying) {
      this.audio.pause()
    } else {
      void this.audio.play()
    }
  }

  private handleProgressPointerDown = (e: PointerEvent): void => {
    this.isDragging = true
    this.playerEl.classList.add('player--dragging')
    this.progressContainer.setPointerCapture(e.pointerId)
    this.seekToPointer(e)

    this.progressContainer.addEventListener(
      'pointermove',
      this.handleProgressPointerMove,
    )
    this.progressContainer.addEventListener(
      'pointerup',
      this.handleProgressPointerUp,
    )
  }

  private handleProgressPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return
    this.seekToPointer(e)
  }

  private handleProgressPointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return
    this.isDragging = false
    this.playerEl.classList.remove('player--dragging')
    this.progressContainer.releasePointerCapture(e.pointerId)
    this.seekToPointer(e)

    this.progressContainer.removeEventListener(
      'pointermove',
      this.handleProgressPointerMove,
    )
    this.progressContainer.removeEventListener(
      'pointerup',
      this.handleProgressPointerUp,
    )
  }

  private handleProgressKeydown = (e: KeyboardEvent): void => {
    if (this.duration === 0) return

    let newTime = this.audio.currentTime

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newTime = Math.min(this.duration, newTime + SEEK_STEP)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        newTime = Math.max(0, newTime - SEEK_STEP)
        break
      case 'Home':
        newTime = 0
        break
      case 'End':
        newTime = this.duration
        break
      case 'PageUp':
        newTime = Math.min(
          this.duration,
          newTime + this.duration * SEEK_PAGE_FACTOR,
        )
        break
      case 'PageDown':
        newTime = Math.max(0, newTime - this.duration * SEEK_PAGE_FACTOR)
        break
      default:
        return
    }

    e.preventDefault()
    this.audio.currentTime = newTime
    this.updateProgress()
  }

  private seekToPointer(e: PointerEvent): void {
    const rect = this.progressTrack.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    this.audio.currentTime = ratio * this.duration
    this.updateProgress()
  }

  private updateProgress(): void {
    const progress =
      this.duration > 0 ? (this.audio.currentTime / this.duration) * 100 : 0
    this.progressFill.style.inlineSize = `${progress}%`
    this.progressThumb.style.insetInlineStart = `${progress}%`
    this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime)
    this.updateSliderAria()
  }

  private updateSliderAria(): void {
    this.progressContainer.setAttribute(
      'aria-valuemax',
      String(Math.round(this.duration)),
    )
    this.progressContainer.setAttribute(
      'aria-valuenow',
      String(Math.round(this.audio.currentTime)),
    )
    this.progressContainer.setAttribute(
      'aria-valuetext',
      this.formatTimeText(this.audio.currentTime, this.duration),
    )
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  private formatTimeText(current: number, total: number): string {
    const fmt = (s: number): string => {
      const mins = Math.floor(s / 60)
      const secs = Math.floor(s % 60)
      const parts: string[] = []
      if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`)
      if (secs > 0 || mins === 0)
        parts.push(`${secs} ${secs === 1 ? 'Sekunde' : 'Sekunden'}`)
      return parts.join(' ')
    }
    return `${fmt(current)} von ${fmt(total)}`
  }

  private announce(message: string): void {
    this.liveRegion.textContent = ''
    requestAnimationFrame(() => {
      this.liveRegion.textContent = message
    })
  }
}

customElements.define('recipe-audio', RecipeAudio)
