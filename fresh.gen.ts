// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $api_callback from "./routes/api/callback.ts";
import * as $api_checkLogin from "./routes/api/checkLogin.ts";
import * as $api_getHours from "./routes/api/getHours.ts";
import * as $api_login from "./routes/api/login.ts";
import * as $api_logout from "./routes/api/logout.ts";
import * as $api_shifts from "./routes/api/shifts.ts";
import * as $api_shiftsHandler from "./routes/api/shiftsHandler.ts";
import * as $detail_name_ from "./routes/detail/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $list from "./routes/list.tsx";
import * as $Detail from "./islands/Detail.tsx";
import * as $List from "./islands/List.tsx";
import * as $Login from "./islands/Login.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/api/callback.ts": $api_callback,
    "./routes/api/checkLogin.ts": $api_checkLogin,
    "./routes/api/getHours.ts": $api_getHours,
    "./routes/api/login.ts": $api_login,
    "./routes/api/logout.ts": $api_logout,
    "./routes/api/shifts.ts": $api_shifts,
    "./routes/api/shiftsHandler.ts": $api_shiftsHandler,
    "./routes/detail/[name].tsx": $detail_name_,
    "./routes/index.tsx": $index,
    "./routes/list.tsx": $list,
  },
  islands: {
    "./islands/Detail.tsx": $Detail,
    "./islands/List.tsx": $List,
    "./islands/Login.tsx": $Login,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
