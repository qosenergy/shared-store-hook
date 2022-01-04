"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoActions = exports.ActionsOnly = void 0;
exports.ActionsOnly = Symbol("return (potentially mapped) actions only, do not re-render if any part of the state changes");
exports.NoActions = Symbol("return (potentially mapped) state only, re-render if needed");
