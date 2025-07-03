import { registerPlugin, PluginListenerHandle } from "@capacitor/core";

// Define the TypeScript interface for our native plugin
export interface CapacitorMediaPipePlugin {
  initialize(options: any): Promise<void>;
  send(options: { image: string }): Promise<void>;
  close(): Promise<void>;
  addListener(
    eventName: "holisticResults",
    listenerFunc: (results: any) => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

// Register the plugin with Capacitor
const CapacitorMediaPipe = registerPlugin<CapacitorMediaPipePlugin>(
  "CapacitorMediaPipe"
);

export default CapacitorMediaPipe;
