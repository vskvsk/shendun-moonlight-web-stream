import "./polyfill/index.js"
import { Api, getApi, apiPostHost, FetchError, apiLogout, apiGetUser, tryLogin, apiGetHost, apiGetRole, apiPatchRole, apiGetHosts, apiPostPair } from "./api.js";
import { AddHostModal } from "./component/host/add_modal.js";
import { HostList } from "./component/host/list.js";
import { Component, ComponentEvent } from "./component/index.js";
import { showErrorPopup } from "./component/error.js";
import { showMessage, showModal } from "./component/modal/index.js";
import { setContextMenu } from "./component/context_menu.js";
import { GameList } from "./component/game/list.js";
import { Host } from "./component/host/index.js";
import { App, DetailedRole, DetailedUser } from "./api_bindings.js";
import { getLocalStreamSettings, globalDefaultSettings, setLocalStreamSettings, StreamSettingsComponent } from "./component/settings_menu.js";
import { adoptRoleDefaultLanguage, getCurrentLanguage, getTranslations } from "./i18n.js";
import { setTouchContextMenuEnabled } from "./polyfill/ios_right_click.js";
import { buildUrl } from "./config_.js";
import { setStyle as setPageStyle } from "./styles/index.js";

let I = getTranslations(getCurrentLanguage())

async function startApp() {
    setTouchContextMenuEnabled(true)

    const api = await getApi()

    const bootstrapRole = await apiGetRole(api, { id: null })
    adoptRoleDefaultLanguage(bootstrapRole.role.default_settings)
    I = getTranslations(getCurrentLanguage())

    const rootElement = document.getElementById("root");
    if (rootElement == null) {
        showErrorPopup(I.index.rootNotFound, true)
        return;
    }

    let lastAppState: AppState | null = null
    if (sessionStorage) {
        const lastStateText = sessionStorage.getItem("mlState")
        if (lastStateText) {
            lastAppState = JSON.parse(lastStateText)
        }
    }

    const app = new MainApp(api, bootstrapRole.role)
    app.mount(rootElement)

    window.addEventListener("popstate", event => {
        app.setAppState(event.state, false)
    })

    app.forceFetch()

    if (lastAppState) {
        app.setAppState(lastAppState)
    }
}

startApp()

type DisplayStates = "hosts" | "games" | "settings"

type AppState = { display: DisplayStates, hostId?: number }
function setAppState(state: AppState, pushHistory: boolean) {
    if (pushHistory) {
        history.pushState(state, "")
    }

    if (sessionStorage) {
        sessionStorage.setItem("mlState", JSON.stringify(state))
    }
}
function backAppState() {
    history.back()
}

class MainApp implements Component {
    private api: Api
    private user: DetailedUser | null = null
    private role: DetailedRole | null = null
    private _mlUrlParamsHandled = false

    private divElement = document.createElement("div")

    // Top Line
    private topLine = document.createElement("div")

    private moonlightTextElement = document.createElement("h1")

    private topLineActions = document.createElement("div")
    private logoutButton = document.createElement("button")
    // This is for the default user
    private loginButton = document.createElement("button")
    private adminButton = document.createElement("button")

    // Actions
    private actionElement = document.createElement("div")

    private backButton: HTMLButtonElement = document.createElement("button")

    private hostAddButton: HTMLButtonElement = document.createElement("button")
    private settingsButton: HTMLButtonElement = document.createElement("button")
    private saveRoleDefaultsButton: HTMLButtonElement = document.createElement("button")

    // Different submenus
    private currentDisplay: DisplayStates | null = null

    private hostList: HostList
    private gameList: GameList | null = null
    private settings: StreamSettingsComponent | null = null

    constructor(api: Api, bootstrapRole: DetailedRole) {
        this.api = api
        this.role = bootstrapRole

        // Top Line
        this.topLine.classList.add("top-line")

        this.moonlightTextElement.innerHTML = I.index.appTitle
        this.topLine.appendChild(this.moonlightTextElement)

        this.topLine.appendChild(this.topLineActions)
        this.topLineActions.classList.add("top-line-actions")

        this.logoutButton.addEventListener("click", async () => {
            await apiLogout(this.api)
            window.location.reload()
        })
        this.logoutButton.classList.add("logout-button")

        this.loginButton.addEventListener("click", async () => {
            const success = await tryLogin()
            if (success) {
                window.location.reload()
            }
        })
        this.loginButton.classList.add("login-button")

        this.adminButton.addEventListener("click", async () => {
            window.location.href = buildUrl("/admin.html")
        })
        this.adminButton.classList.add("admin-button")

        // Actions
        this.actionElement.classList.add("actions-list")

        // Back button
        this.backButton.innerText = I.index.back
        this.backButton.classList.add("button-fit-content")
        this.backButton.addEventListener("click", backAppState)

        // Host add button
        this.hostAddButton.classList.add("host-add")
        this.hostAddButton.addEventListener("click", this.addHost.bind(this))

        // Host list
        this.hostList = new HostList(api)
        this.hostList.addHostOpenListener(this.onHostOpen.bind(this))

        // Settings Button
        this.settingsButton.classList.add("open-settings")
        this.settingsButton.addEventListener("click", () => this.setCurrentDisplay("settings"))

        this.saveRoleDefaultsButton.innerText = I.settings.saveRoleDefaults
        this.saveRoleDefaultsButton.classList.add("button-fit-content")
        this.saveRoleDefaultsButton.addEventListener("click", this.onSaveRoleDefaults.bind(this))

        // Settings
        this.settings = new StreamSettingsComponent(
            bootstrapRole.permissions,
            getLocalStreamSettings(bootstrapRole.default_settings)
        )
        this.settings.addChangeListener(this.onSettingsChange.bind(this))

        // Append default elements
        this.divElement.appendChild(this.topLine)
        this.divElement.appendChild(this.actionElement)

        this.setCurrentDisplay("hosts")

        // Context Menu
        document.body.addEventListener("contextmenu", this.onContextMenu.bind(this), { passive: false })
    }

    setAppState(state: AppState, pushIntoHistory?: boolean) {
        if (state.display == "hosts") {
            this.setCurrentDisplay("hosts", null, pushIntoHistory)
        } else if (state.display == "games" && state.hostId != null) {
            this.setCurrentDisplay("games", { hostId: state.hostId }, pushIntoHistory)
        } else if (state.display == "settings") {
            this.setCurrentDisplay("settings", null, pushIntoHistory)
        }
    }

    private async addHost() {
        const modal = new AddHostModal()

        let host = await showModal(modal);

        if (host) {
            let newHost
            try {
                newHost = await apiPostHost(this.api, host)
            } catch (e) {
                if (e instanceof FetchError) {
                    const response = e.getResponse()
                    if (response && response.status == 404) {
                        showErrorPopup(I.index.addHostUnreachable(host.address))
                        return
                    }
                }
                throw e
            }

            this.hostList.insertList(newHost.host_id, newHost)
        }
    }

    private onContextMenu(event: MouseEvent) {
        if (this.currentDisplay == "hosts" || this.currentDisplay == "games") {
            const elements = [
                {
                    name: I.index.reload,
                    callback: this.forceFetch.bind(this)
                }
            ]

            setContextMenu(event, {
                elements
            })
        }
    }

    private async onHostOpen(event: ComponentEvent<Host>) {
        const hostId = event.component.getHostId()

        this.setCurrentDisplay("games", { hostId })
    }

    private onSettingsChange() {
        if (!this.settings) {
            showErrorPopup(I.index.saveSettingsFailed)
            return
        }

        const previousLanguage = getLocalStreamSettings(globalDefaultSettings()).language
        const newSettings = this.settings.getStreamSettings()

        // store settings in localStorage
        setLocalStreamSettings(newSettings)
        // apply style
        setPageStyle(newSettings.pageStyle)

        if (previousLanguage !== newSettings.language) {
            window.location.reload()
        }
    }

    private async onSaveRoleDefaults() {
        if (!this.settings || !this.role || this.user?.role !== "Admin") {
            showErrorPopup(I.settings.saveRoleDefaultsFailed)
            return
        }

        this.saveRoleDefaultsButton.disabled = true

        try {
            const newSettings = this.settings.getStreamSettings()
            await apiPatchRole(this.api, {
                id: this.role.id,
                name: null,
                ty: this.role.ty,
                default_settings: newSettings,
                permissions: null,
            })

            this.role = {
                ...this.role,
                default_settings: newSettings,
            }

            await showMessage(I.settings.saveRoleDefaultsSuccess)
        } catch {
            showErrorPopup(I.settings.saveRoleDefaultsFailed)
        } finally {
            this.saveRoleDefaultsButton.disabled = false
        }
    }

    private setCurrentDisplay(display: "hosts",
        extraInfo?: null,
        pushIntoHistory?: boolean
    ): void
    private setCurrentDisplay(
        display: "games",
        extraInfo?: {
            hostId?: number | null,
            hostCache?: Array<App>
        },
        pushIntoHistory?: boolean
    ): void
    private setCurrentDisplay(display: "settings", extraInfo?: null, pushIntoHistory?: boolean): void

    private setCurrentDisplay(
        display: "hosts" | "games" | "settings",
        extraInfo?: {
            hostId?: number | null,
            hostCache?: Array<App>
        } | null,
        pushIntoHistory_?: boolean
    ) {
        const pushIntoHistory = pushIntoHistory_ === undefined ? true : pushIntoHistory_

        if (display == "games" && extraInfo?.hostId == null) {
            // invalid input state
            throw "invalid display state was requested"
        }

        // Check if we need to change
        if (this.currentDisplay == display) {
            if (this.currentDisplay == "games" && this.gameList?.getHostId() != extraInfo?.hostId) {
                // fall through
            } else {
                return
            }
        }

        // Unmount the current display
        if (this.currentDisplay == "hosts") {
            this.actionElement.removeChild(this.hostAddButton)
            this.actionElement.removeChild(this.settingsButton)

            this.hostList.unmount(this.divElement)
        } else if (this.currentDisplay == "games") {
            this.actionElement.removeChild(this.backButton)
            this.actionElement.removeChild(this.settingsButton)

            this.gameList?.unmount(this.divElement)
        } else if (this.currentDisplay == "settings") {
            this.actionElement.removeChild(this.backButton)
            if (this.actionElement.contains(this.saveRoleDefaultsButton)) {
                this.actionElement.removeChild(this.saveRoleDefaultsButton)
            }

            this.settings?.unmount(this.divElement)
        }

        // Mount the new display
        if (display == "hosts") {
            this.actionElement.appendChild(this.hostAddButton)
            this.actionElement.appendChild(this.settingsButton)

            this.hostList.mount(this.divElement)

            setAppState({ display: "hosts" }, pushIntoHistory)
        } else if (display == "games" && extraInfo?.hostId != null) {
            this.actionElement.appendChild(this.backButton)
            this.actionElement.appendChild(this.settingsButton)

            if (this.gameList?.getHostId() != extraInfo?.hostId) {
                this.gameList = new GameList(this.api, extraInfo?.hostId, extraInfo?.hostCache ?? null)
                this.gameList.addForceReloadListener(this.forceFetch.bind(this))
            }

            this.gameList.mount(this.divElement)

            this.refreshGameListActiveGame()

            setAppState({ display: "games", hostId: this.gameList?.getHostId() }, pushIntoHistory)
        } else if (display == "settings") {
            this.actionElement.appendChild(this.backButton)
            if (this.user?.role == "Admin") {
                this.actionElement.appendChild(this.saveRoleDefaultsButton)
            }

            this.settings?.mount(this.divElement)

            setAppState({ display: "settings" }, pushIntoHistory)
        }

        this.currentDisplay = display
    }

    async forceFetch() {
        const promiseUser = this.refreshUserRole()
        const promiseRoles = this.refreshUserPermissions()

        await Promise.all([
            this.hostList.forceFetch(),
            this.gameList?.forceFetch()
        ])

        if (this.currentDisplay == "games"
            && this.gameList
            && !this.hostList.getHost(this.gameList.getHostId())) {
            // The newly fetched list doesn't contain the hosts game view we're in -> go to hosts
            this.setCurrentDisplay("hosts")
        }

        await Promise.all([
            promiseUser,
            promiseRoles,
            this.refreshGameListActiveGame()
        ])

        await this.maybeHandleUrlParams()
    }
    private async refreshUserRole() {
        this.user = await apiGetUser(this.api)

        if (this.topLineActions.contains(this.logoutButton)) {
            this.topLineActions.removeChild(this.logoutButton)
        }
        if (this.topLineActions.contains(this.loginButton)) {
            this.topLineActions.removeChild(this.loginButton)
        }
        if (this.topLineActions.contains(this.adminButton)) {
            this.topLineActions.removeChild(this.adminButton)
        }

        if (this.user.is_default_user) {
            this.topLineActions.appendChild(this.loginButton)
        } else {
            this.topLineActions.appendChild(this.logoutButton)
        }

        if (this.user.role == "Admin") {
            this.topLineActions.appendChild(this.adminButton)
            if (this.currentDisplay == "settings" && !this.actionElement.contains(this.saveRoleDefaultsButton)) {
                this.actionElement.appendChild(this.saveRoleDefaultsButton)
            }
        } else if (this.actionElement.contains(this.saveRoleDefaultsButton)) {
            this.actionElement.removeChild(this.saveRoleDefaultsButton)
        }
    }
    private async refreshUserPermissions() {
        const response = await apiGetRole(this.api, { id: null })
        this.role = response.role

        if (this.role.permissions.allow_add_hosts) {
            this.hostAddButton.disabled = false
        } else {
            this.hostAddButton.disabled = true
        }
    }
    private async refreshGameListActiveGame() {
        const gameList = this.gameList
        const hostId = gameList?.getHostId()
        if (hostId == null) {
            return
        }

        const host = this.hostList.getHost(hostId)

        let currentGame = null
        if (host != null) {
            currentGame = await host.getCurrentGame()
        } else {
            const host = await apiGetHost(this.api, { host_id: hostId })
            if (host.current_game != 0) {
                currentGame = host.current_game
            }
        }

        if (currentGame != null) {
            gameList?.setActiveGame(currentGame)
        } else {
            gameList?.setActiveGame(null)
        }
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.divElement)
    }
    unmount(parent: HTMLElement): void {
        parent.removeChild(this.divElement)
    }

    private parseUrlParams(): { address: string | null, port: number | null, pin: string | null } {
        const sp = new URLSearchParams(window.location.search)
        const address = sp.get("address") ?? sp.get("host") ?? sp.get("ip")
        const portStr = sp.get("port") ?? sp.get("http_port")
        const pin = sp.get("pin")
        let port: number | null = null
        if (portStr != null && portStr !== "") {
            const n = Number(portStr)
            if (!Number.isNaN(n) && Number.isFinite(n)) {
                port = n
            }
        }
        return { address: address ?? null, port, pin }
    }
    private async findHostByAddress(address: string, port: number | null): Promise<number | null> {
        const hosts = await apiGetHosts(this.api)
        const ids = hosts.response.hosts.map(h => h.host_id)
        for (const id of ids) {
            try {
                const d = await apiGetHost(this.api, { host_id: id })
                const sameAddress = d.address === address
                const samePort = port == null ? true : d.http_port === port
                if (sameAddress && samePort) {
                    return id
                }
            } catch {
            }
        }
        return null
    }
    private async autoPair(hostId: number, pin: string | null): Promise<boolean> {
        const stream = await apiPostPair(this.api, { host_id: hostId, pin: pin ?? null })
        if (typeof stream.response === "string") {
            return false
        }
        const result = await stream.next()
        if (!result) {
            return false
        }
        if (typeof result === "string") {
            return false
        }
        return true
    }
    private async waitForHostPaired(hostId: number, timeoutMs: number = 60000, intervalMs: number = 1000): Promise<boolean> {
        const start = Date.now()
        while (Date.now() - start < timeoutMs) {
            try {
                const host = await apiGetHost(this.api, { host_id: hostId })
                if (host.paired === "Paired") {
                    return true
                }
            } catch {
            }
            await new Promise(r => setTimeout(r, intervalMs))
        }
        return false
    }
    private async maybeHandleUrlParams() {
        if (this._mlUrlParamsHandled) {
            return
        }
        const { address, port, pin } = this.parseUrlParams()
        if (!address) {
            return
        }
        this._mlUrlParamsHandled = true
        let hostId = await this.findHostByAddress(address, port)
        if (hostId == null) {
            try {
                const newHost = await apiPostHost(this.api, { address, http_port: port })
                hostId = newHost.host_id
                this.hostList.insertList(newHost.host_id, newHost)
            } catch {
                return
            }
        }
        try {
            const host = await apiGetHost(this.api, { host_id: hostId })
            if (host.paired === "Paired") {
                this.setCurrentDisplay("games", { hostId })
                return
            }
        } catch {
        }
        const pairedStarted = await this.autoPair(hostId, pin)
        if (!pairedStarted) {
            return
        }
        const ok = await this.waitForHostPaired(hostId)
        if (ok) {
            this.setCurrentDisplay("games", { hostId })
        }
    }
}
