// app/api/badges/[username]/[color]/route.js
import fs from "fs/promises";
import path from "path";
import { ImageResponse } from "@vercel/og";
import { getCreatorAction } from "@/actions/creator-actions";
import { NextResponse } from "next/server";
import { getDisplayName } from "@/utils/display-name";

export async function GET(request, { params }) {
  // const ua = request.headers.get("user-agent") || "";
  // const isBot = /bot|facebookexternalhit|Twitterbot|Googlebot|Applebot/i.test(
  //   ua
  // );

  // if (!isBot) {
  //   return NextResponse.redirect(
  //     `${process.env.NEXT_PUBLIC_CLIENT_URL}/${params.username}`,
  //     307
  //   );
  // }

  // Await the params object before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username, color } = resolvedParams;
  const url = new URL(request.url);
  const scale = parseFloat(url.searchParams.get("scale") || "1");

  const creatorResponse = await getCreatorAction(username);
  if (!creatorResponse.success || !creatorResponse.data) {
    return new Response(JSON.stringify({ error: "Creator not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const creator = creatorResponse.data;

  const displayName = getDisplayName(creator);

  const joinedDate = creator.created_at
    ? new Date(creator.created_at)
        .toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, "/")
    : "06/06/25";

  const imgPath =
    color === "black"
      ? path.join(process.cwd(), "public", "badge-black-1.jpg")
      : path.join(process.cwd(), "public", "badge-white-1.jpg");
  const imgData = await fs.readFile(imgPath);
  const bgDataUri = `data:image/jpeg;base64,${imgData.toString("base64")}`;

  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "HelveticaNeueMedium.otf"
  );
  const fontData = await fs.readFile(fontPath);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          borderRadius: 12,
          position: "relative",
          color: color === "black" ? "white" : "black",
        }}
      >
        <img src={bgDataUri} alt="Badge Background" />
        {/* Username position */}
        <div
          style={{
            position: "absolute",
            bottom: "32%",
            right: 24 * scale,
            fontSize: 12 * scale,
            textAlign: "right",
            display: "flex",
          }}
        >
          @{creator.username}
        </div>

        {/* Bottom content container */}
        <div
          style={{
            marginTop: "auto",
            padding: 24 * scale,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Name and role */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              style={{
                fontSize: 32 * scale,
                fontWeight: 500,
                display: "flex",
                fontFamily: "HelveticaNeueLight",
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontSize: 18 * scale,
                fontWeight: 300,
                display: "flex",
                fontFamily: "HelveticaNeueLight",
              }}
            >
              {creator.primary_role?.[0] || "Creative"}
            </div>
          </div>

          {/* Bottom metadata */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              marginTop: 16,
              fontSize: 9 * scale,
              opacity: 0.8,
              fontFamily: "HelveticaNeueLight",
            }}
          >
            <span>{creator.location || "New York, NY"}</span>
            <span>www.that-sauce.com</span>
            <span>Joined: {joinedDate}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 320 * scale,
      height: 437 * scale,
      deviceScaleFactor: scale,
      fonts: [
        {
          name: "HelveticaNeueLight",
          data: fontData,
        },
      ],
    }
  );
}
