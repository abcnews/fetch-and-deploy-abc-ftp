import "@std/dotenv/load";
import { Client } from "basic-ftp";

const main = async () => {
  // Fetch data energex-unplanned.geojson, ergon-unplanned.geojson and essential-energy.geojson
  const base =
    "https://raw.githubusercontent.com/drzax/ausgrid-outages/refs/heads/main/";

  const files = [
    "energex-unplanned.geojson",
    "ergon-unplanned.geojson",
    "essential-energy.geojson",
  ];

  // Fetch all
  const promises = files.map((file) => fetch(base + file));
  const responses = await Promise.all(promises);

  // Check all responses
  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
  }

  // Write to files
  for (const [index, response] of responses.entries()) {
    const file = files[index];
    const data = await response.text();
    await Deno.writeTextFile(file, data);
  }

  // Upload FTP
  const client = new Client();

  client.ftp.verbose = true;

  try {
    await client.access({
      host: Deno.env.get("HOST"),
      user: Deno.env.get("USERNAME"),
      password: Deno.env.get("PASSWORD"),
      port: Number(Deno.env.get("PORT")),
    });

    await client.cd("/www/dat/news/alfred-power-outages");

    console.log(await client.list());

    // Upload all files
    for (const file of files) {
      await client.uploadFrom(file, file);
    }
  } catch (err) {
    console.error(err);
  }

  client.close();
};

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}
