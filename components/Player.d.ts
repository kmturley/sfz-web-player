import { AudioOptions, EditorOptions, InterfaceOptions, PlayerOptions } from "../types/player";
import Component from "./component";
import "./Player.scss";
import { FileWithDirectoryAndFileHandle } from "browser-fs-access";
declare class Player extends Component {
    private audio?;
    private editor?;
    private interface?;
    private loader;
    constructor(id: string, options: PlayerOptions);
    setupAudio(options: AudioOptions): void;
    setupInterface(options: InterfaceOptions): void;
    setupEditor(options: EditorOptions): void;
    setupHeader(): void;
    loadLocalInstrument(): Promise<void>;
    loadRemoteInstrument(repo: string): Promise<void>;
    loadDirectory(root: string, files: string[] | FileWithDirectoryAndFileHandle[]): Promise<void>;
}
export default Player;
