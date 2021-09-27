export enum CoreContext {
    Web = "Web",
    Cordova = "Cordova",
    Node = "Node"
}

export namespace CoreContext {
    let _currentContext: CoreContext | undefined

    function _queryContext(): CoreContext {
        if (typeof window === "undefined") {
            return CoreContext.Node
        }

        if (!(window as any).isCordovaApp) {
            return CoreContext.Web
        }

        return CoreContext.Cordova
    }

    export function currentContext(): CoreContext {
        if (!_currentContext) {
            _currentContext = _queryContext()
        }

        return _currentContext
    }
}
