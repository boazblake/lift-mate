import Capacitor

@objc(CapacitorMediaPipePlugin)
public class CapacitorMediaPipePlugin: CAPPlugin {
    private let implementation = CapacitorMediaPipe()

    override public func load() {
        implementation.resultsHandler = { [weak self] results in
            self?.notifyListeners("holisticResults", data: results)
        }
    }

    @objc func initialize(_ call: CAPPluginCall) {
        implementation.initialize(call)
    }

    @objc func send(_ call: CAPPluginCall) {
        implementation.send(call)
    }

    @objc func close(_ call: CAPPluginCall) {
        implementation.close(call)
    }
}