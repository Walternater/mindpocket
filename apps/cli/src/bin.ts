#!/usr/bin/env node

import { runCli } from "./cli.js"
import { installNetworkRuntime } from "./lib/network-runtime.js"

installNetworkRuntime()
const exitCode = await runCli(process.argv.slice(2))
process.exit(exitCode)
