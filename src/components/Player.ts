import { PlayerOptions } from "../types/player";
import Component from "./component";
import Editor from "./Editor";
import Interface from "./Interface";
import "./Player.scss";
import {
  directoryOpen,
  FileWithDirectoryAndFileHandle,
} from "browser-fs-access";

class Player extends Component {
  private editor?: Editor;
  private interface?: Interface;

  constructor(id: string, options: PlayerOptions) {
    super("player");
    if (options.header) {
      this.setupHeader();
    }
    if (options.interface) {
      this.interface = new Interface(options.interface);
      this.getEl().appendChild(this.interface.getEl());
    }
    if (options.editor) {
      this.editor = new Editor(options.editor);
      this.getEl().appendChild(this.editor.getEl());
    }
    document.getElementById(id)?.appendChild(this.getEl());
  }

  setupHeader() {
    const div: HTMLDivElement = document.createElement("div");
    div.className = "header";

    const input: HTMLInputElement = document.createElement("input");
    input.type = "button";
    input.value = "Select directory";
    input.addEventListener("click", async (e) => {
      try {
        const blobs:
          | FileWithDirectoryAndFileHandle[]
          | FileSystemDirectoryHandle[] = await directoryOpen({
          recursive: true,
        });
        console.log(`${blobs.length} files selected.`);
        if (this.editor) {
          this.editor.loadDirectoryLocal(blobs);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          return console.error(err);
        }
        console.log("The user aborted a request.");
      }
    });
    div.appendChild(input);

    this.getEl().appendChild(div);
  }
}

export default Player;
