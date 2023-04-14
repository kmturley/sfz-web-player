import { FileWithDirectoryAndFileHandle } from "browser-fs-access";
import FileLoader from "../utils/fileLoader";
interface AudioOptions {
    file?: string | FileWithDirectoryAndFileHandle;
    loader?: FileLoader;
    root?: string;
}
interface EditorOptions {
    directory?: string[] | FileWithDirectoryAndFileHandle[];
    file?: string | FileWithDirectoryAndFileHandle;
    loader?: FileLoader;
    root?: string;
}
interface InterfaceOptions {
    directory?: string[] | FileWithDirectoryAndFileHandle[];
    file?: string | FileWithDirectoryAndFileHandle;
    loader?: FileLoader;
    root?: string;
}
interface PlayerOptions {
    audio?: AudioOptions;
    editor?: EditorOptions;
    header?: boolean;
    interface?: InterfaceOptions;
}
export { AudioOptions, EditorOptions, InterfaceOptions, PlayerOptions };