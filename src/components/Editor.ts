import "./Editor.scss";
import Component from "./component";
import * as ace from "ace-builds";
import * as modelist from "ace-builds/src-noconflict/ext-modelist";
import "ace-builds/webpack-resolver";
import { FileLocal, FileRemote, FilesMap, FilesTree } from "../types/files";
import { EditorOptions } from "../types/player";
const Mode = require("../lib/mode-sfz").Mode;
import * as path from "path-browserify";
import { FileWithDirectoryAndFileHandle } from "browser-fs-access";
import { get } from "../utils/api";
import {
  pathGetDirectory,
  pathGetExt,
  pathGetRoot,
  pathGetSubDirectories,
} from "../utils/utils";

class Editor extends Component {
  private branch: string = "main";
  private files: FilesMap = {};
  private filesTree: FilesTree = {};
  private directory: string = "";
  private ace: any;
  private supportedFiles: string[] = [
    "json",
    "json",
    "md",
    "sfz",
    "txt",
    "xml",
    "yml",
    "yaml",
  ];

  private aceEl: HTMLDivElement;
  private fileEl: HTMLDivElement;

  constructor(options: EditorOptions) {
    super("editor");

    this.fileEl = document.createElement("div");
    this.fileEl.className = "fileList";
    this.getEl().appendChild(this.fileEl);

    this.aceEl = document.createElement("div");
    this.aceEl.className = "ace";
    this.ace = ace.edit(this.aceEl, {
      theme: "ace/theme/monokai",
    });
    this.getEl().appendChild(this.aceEl);

    if (options.directory) this.addDirectory(options.directory);
    if (options.file) {
      const file: FileLocal | FileRemote | undefined = this.addFile(
        options.file
      );
      this.showFile(file);
      this.render();
    }
  }

  addDirectory(files: string[] | FileWithDirectoryAndFileHandle[]) {
    if (typeof files[0] === "string") {
      this.setDirectory(pathGetDirectory(files[0]));
    } else {
      this.setDirectory(pathGetRoot(files[0].webkitRelativePath));
    }
    this.resetFiles();
    files.forEach((file: string | FileWithDirectoryAndFileHandle) =>
      this.addFile(file)
    );
    this.render();
  }

  addFile(file: string | FileWithDirectoryAndFileHandle) {
    let item: FileLocal | FileRemote;
    if (typeof file === "string") {
      if (file === this.directory) return;
      item = {
        ext: pathGetExt(file),
        contents: null,
        path: decodeURI(file),
      };
    } else {
      item = {
        ext: pathGetExt(file.webkitRelativePath),
        contents: null,
        path: decodeURI(file.webkitRelativePath),
        handle: file,
      };
    }
    const pathSubDir: string = pathGetSubDirectories(item.path, this.directory);
    this.files[pathSubDir] = item;
    pathSubDir
      .split("/")
      .reduce((o: any, k: string) => (o[k] = o[k] || {}), this.filesTree);
    return item;
  }

  async loadFile(file: string | FileWithDirectoryAndFileHandle) {
    if (typeof file === "string") {
      return {
        ext: pathGetExt(file),
        contents: await get(file),
        path: decodeURI(file),
      } as FileRemote;
    } else {
      return {
        ext: pathGetExt(file.webkitRelativePath),
        contents: await file.text(),
        path: file.webkitRelativePath,
      } as FileLocal;
    }
  }

  setDirectory(dir: string) {
    this.directory = dir;
  }

  async showFile(file: FileLocal | FileRemote | undefined) {
    if (!file) return;
    if (typeof file === "string") {
      const pathSubDir: string = pathGetSubDirectories(file, this.directory);
      file = this.files[pathSubDir];
    }
    if (!file.contents) {
      const pathSubDir: string = pathGetSubDirectories(
        file.path,
        this.directory
      );
      if ("handle" in file) {
        file = await this.loadFile(file.handle);
        this.files[pathSubDir] = file;
      } else {
        file = await this.loadFile(file.path);
        this.files[pathSubDir] = file;
      }
    }
    if (file.ext === "sfz") {
      this.ace.session.setMode(new Mode());
    } else {
      const mode: string = modelist.getModeForPath(file.path).mode;
      this.ace.session.setMode(mode);
    }
    this.ace.setOption("value", file.contents);
  }

  resetFiles() {
    this.files = {};
    this.filesTree = {};
  }

  createTree(
    root: string,
    branch: string,
    files: FilesMap,
    filesTree: FilesTree
  ) {
    const ul: HTMLUListElement = document.createElement("ul");
    for (const key in filesTree) {
      const filePath: string = path.join(root, key);
      const li: HTMLLIElement = document.createElement("li");
      if (Object.keys(filesTree[key]).length > 0) {
        const details: HTMLDetailsElement = document.createElement("details");
        const summary: HTMLElement = document.createElement("summary");
        summary.innerHTML = key;
        summary.addEventListener("click", async () => {
          await this.showFile(files[filePath]);
        });
        details.appendChild(summary);
        details.appendChild(
          this.createTree(filePath, branch, files, filesTree[key])
        );
        li.appendChild(details);
      } else {
        li.innerHTML = key;
        li.addEventListener("click", async () => {
          await this.showFile(files[filePath]);
        });
      }
      ul.appendChild(li);
    }
    return ul;
  }

  render() {
    this.fileEl.replaceChildren();
    this.fileEl.innerHTML = this.directory;
    const ul: HTMLUListElement = this.createTree(
      "",
      this.branch,
      this.files,
      this.filesTree
    );
    ul.className = "tree";
    this.fileEl.appendChild(ul);
  }
}

export default Editor;
