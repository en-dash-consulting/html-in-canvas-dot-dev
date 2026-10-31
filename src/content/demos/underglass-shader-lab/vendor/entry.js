import { createElement, Fragment, useEffect, useRef, useState } from "react";
import { createCanvasHosts, defineEffect, mountCanvasApp, Surface, useGPUHost } from "@underglass/react";
window.Underglass = { createElement, Fragment, useEffect, useRef, useState, createCanvasHosts, defineEffect, mountCanvasApp, Surface, useGPUHost };
