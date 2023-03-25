import "../lib/webaudio-controls";
import "./Interface.scss";
import { xml2js } from "xml-js";
import { InterfaceOptions } from "../types/player";
import Component from "./component";
import { FileLocal, FileRemote } from "../types/files";
import {
  PlayerButton,
  PlayerElement,
  PlayerElements,
  PlayerImage,
  PlayerKnob,
  PlayerSlider,
  PlayerText,
} from "../types/interface";
import FileLoader from "../utils/fileLoader";
import { pathExt, pathSubDir } from "../utils/utils";

class Interface extends Component {
  private instrument: { [name: string]: any[] } = {};
  private tabs: HTMLDivElement;
  loader: FileLoader;

  constructor(options: InterfaceOptions) {
    super("interface");

    this.tabs = document.createElement("div");
    this.tabs.className = "tabs";
    this.addTab("Info");
    this.addTab("Controls");
    this.getEl().appendChild(this.tabs);
    this.addKeyboard();

    if (options.loader) {
      this.loader = options.loader;
    } else {
      this.loader = new FileLoader();
    }
    if (options.root) this.loader.setRoot(options.root);
    if (options.directory) this.loader.addDirectory(options.directory);
    if (options.file) {
      const file: FileLocal | FileRemote | undefined = this.loader.addFile(
        options.file
      );
      this.showFile(file);
    }
  }

  async showFile(file: FileLocal | FileRemote | undefined) {
    if (!file) return;
    if (typeof file === "string") {
      const fileKey: string = pathSubDir(file, this.loader.root);
      file = this.loader.files[fileKey];
    }
    if (!file.contents) {
      const fileKey: string = pathSubDir(file.path, this.loader.root);
      if ("handle" in file) {
        file = await this.loader.loadFile(file.handle);
        this.loader.files[fileKey] = file;
      } else {
        file = await this.loader.loadFile(file.path);
        this.loader.files[fileKey] = file;
      }
    }
    this.instrument = this.parseXML(file);
    this.render();
  }

  render() {
    this.setupInfo();
    this.setupControls();
  }

  async loadXML(path: string) {
    console.log("loadXML", path);
    const file: FileLocal | FileRemote = await this.loader.loadFile(path);
    return this.parseXML(file);
  }

  async addImage(image: PlayerImage) {
    const img: HTMLImageElement = document.createElement("img");
    img.setAttribute("draggable", "false");
    img.setAttribute(
      "style",
      `left: ${image.x}px; top: ${image.y}px; height: ${image.h}px; width: ${image.w}px`
    );
    this.addImageAtr(img, "src", image.image);
    return img;
  }

  addImageAtr(img: HTMLImageElement, attribute: string, path: string) {
    img.setAttribute(attribute, this.loader.root + "GUI/" + path);
  }

  addControl(type: PlayerElements, element: PlayerElement) {
    const el: any = document.createElement(`webaudio-${type}`);
    if ("image" in element) this.addImageAtr(el, "src", element.image);
    if ("image_bg" in element) this.addImageAtr(el, "src", element.image_bg);
    if ("image_handle" in element)
      this.addImageAtr(el, "knobsrc", element.image_handle);
    if ("frames" in element) {
      el.setAttribute("value", "0");
      el.setAttribute("max", Number(element.frames) - 1);
      el.setAttribute("step", "1");
      el.setAttribute("sprites", Number(element.frames) - 1);
      el.setAttribute("tooltip", "%d");
    }
    if ("orientation" in element) {
      const dir: string = element.orientation === "vertical" ? "vert" : "horz";
      el.setAttribute("direction", dir);
    }
    if ("x" in element) {
      el.setAttribute("style", `left: ${element.x}px; top: ${element.y}px`);
    }
    if ("w" in element) {
      el.setAttribute("height", element.h);
      el.setAttribute("width", element.w);
    }
    return el;
  }

  addKeyboard() {
    const keys: HTMLElement = document.createElement("webaudio-keyboard");
    keys.setAttribute("keys", "88");
    keys.setAttribute("height", "70");
    keys.setAttribute("width", "775");
    this.getEl().appendChild(keys);
  }

  addTab(name: string) {
    const input: HTMLInputElement = document.createElement("input");
    input.className = "radiotab";
    if (name === "Info") input.setAttribute("checked", "checked");
    input.type = "radio";
    input.id = name.toLowerCase();
    input.name = "tabs";
    this.tabs.appendChild(input);

    const label: HTMLLabelElement = document.createElement("label");
    label.className = "label";
    label.setAttribute("for", name.toLowerCase());
    label.innerHTML = name;
    this.tabs.appendChild(label);

    const div: HTMLDivElement = document.createElement("div");
    div.className = "panel";
    this.tabs.appendChild(div);
  }

  addText(text: PlayerText) {
    const span: HTMLSpanElement = document.createElement("span");
    span.setAttribute(
      "style",
      `left: ${text.x}px; top: ${text.y}px; color: ${text.color_text}; height: ${text.h}px; width: ${text.w}px`
    );
    span.innerHTML = text.text;
    return span;
  }

  parseXML(file: FileLocal | FileRemote) {
    const fileParsed: any = xml2js(file.contents);
    return this.findElements({}, fileParsed.elements);
  }

  async setupInfo() {
    if (!this.instrument.AriaGUI) return;
    const info: Element = this.tabs.getElementsByClassName("panel")[0];
    info.replaceChildren();
    const fileXml: any = await this.loadXML(
      this.loader.root + this.instrument.AriaGUI[0].path
    );
    info.appendChild(await this.addImage(fileXml.StaticImage[0]));
  }

  async setupControls() {
    if (!this.instrument.AriaProgram) return;
    const controls: Element = this.tabs.getElementsByClassName("panel")[1];
    controls.replaceChildren();
    const fileProgram: any = await this.loadXML(
      this.loader.root + this.instrument.AriaProgram[0].gui
    );
    if (fileProgram.Knob)
      fileProgram.Knob.forEach((knob: PlayerKnob) =>
        controls.appendChild(this.addControl(PlayerElements.Knob, knob))
      );
    if (fileProgram.OnOffButton)
      fileProgram.OnOffButton.forEach((button: PlayerButton) =>
        controls.appendChild(this.addControl(PlayerElements.Switch, button))
      );
    if (fileProgram.Slider)
      fileProgram.Slider.forEach((slider: PlayerSlider) =>
        controls.appendChild(this.addControl(PlayerElements.Slider, slider))
      );
    if (fileProgram.StaticImage)
      fileProgram.StaticImage.forEach(async (image: PlayerImage) =>
        controls.appendChild(await this.addImage(image))
      );
    if (fileProgram.StaticText)
      fileProgram.StaticText.forEach((text: PlayerText) =>
        controls.appendChild(this.addText(text))
      );
  }

  findElements(list: { [name: string]: any[] }, nodes: any[]) {
    nodes.forEach((node: any) => {
      if (node.type === "element") {
        if (!list[node.name]) list[node.name] = [];
        list[node.name].push(node.attributes);
      }
      if (node.elements) {
        this.findElements(list, node.elements);
      }
    });
    return list;
  }
}

export default Interface;
