// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_middleware from "./routes/_middleware.ts";
import * as $api_addCalendar from "./routes/api/addCalendar.ts";
import * as $api_callback from "./routes/api/callback.ts";
import * as $api_checkLogin from "./routes/api/checkLogin.ts";
import * as $api_deleteCalendar from "./routes/api/deleteCalendar.ts";
import * as $api_getCalendars from "./routes/api/getCalendars.ts";
import * as $api_getHours from "./routes/api/getHours.ts";
import * as $api_getUserName from "./routes/api/getUserName.ts";
import * as $api_login from "./routes/api/login.ts";
import * as $api_logout from "./routes/api/logout.ts";
import * as $api_refreshAccessToken from "./routes/api/refreshAccessToken.ts";
import * as $api_shifts from "./routes/api/shifts.ts";
import * as $api_updateCalendar from "./routes/api/updateCalendar.ts";
import * as $api_updateData from "./routes/api/updateData.ts";
import * as $detail_name_ from "./routes/detail/[name].tsx";
import * as $index from "./routes/index.tsx";
import * as $login from "./routes/login.tsx";
import * as $profile from "./routes/profile.tsx";
import * as $setting from "./routes/setting.tsx";
import * as $CalendarSetting from "./islands/CalendarSetting.tsx";
import * as $Detail from "./islands/Detail.tsx";
import * as $Header from "./islands/Header.tsx";
import * as $List from "./islands/List.tsx";
import * as $Login from "./islands/Login.tsx";
import * as $Profile from "./islands/Profile.tsx";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_middleware.ts": $_middleware,
    "./routes/api/addCalendar.ts": $api_addCalendar,
    "./routes/api/callback.ts": $api_callback,
    "./routes/api/checkLogin.ts": $api_checkLogin,
    "./routes/api/deleteCalendar.ts": $api_deleteCalendar,
    "./routes/api/getCalendars.ts": $api_getCalendars,
    "./routes/api/getHours.ts": $api_getHours,
    "./routes/api/getUserName.ts": $api_getUserName,
    "./routes/api/login.ts": $api_login,
    "./routes/api/logout.ts": $api_logout,
    "./routes/api/refreshAccessToken.ts": $api_refreshAccessToken,
    "./routes/api/shifts.ts": $api_shifts,
    "./routes/api/updateCalendar.ts": $api_updateCalendar,
    "./routes/api/updateData.ts": $api_updateData,
    "./routes/detail/[name].tsx": $detail_name_,
    "./routes/index.tsx": $index,
    "./routes/login.tsx": $login,
    "./routes/profile.tsx": $profile,
    "./routes/setting.tsx": $setting,
  },
  islands: {
    "./islands/CalendarSetting.tsx": $CalendarSetting,
    "./islands/Detail.tsx": $Detail,
    "./islands/Header.tsx": $Header,
    "./islands/List.tsx": $List,
    "./islands/Login.tsx": $Login,
    "./islands/Profile.tsx": $Profile,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
