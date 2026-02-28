import { generateOpenAPIDocument } from "../src/lib/openapi";
import "../src/lib/openapi-paths";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

try {
  const document = generateOpenAPIDocument();
  
  const publicDir = path.join(process.cwd(), "public");
  try {
    mkdirSync(publicDir);
  } catch {
    // Ya existe
  }
  
  const outputPath = path.join(publicDir, "openapi.json");
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  
  console.log("✅ OpenAPI spec generado exitosamente");
  console.log(`📁 Ubicación: ${outputPath}`);
  console.log(`📊 Endpoints registrados: ${Object.keys(document.paths || {}).length}`);
} catch (error) {
  console.error("❌ Error generando OpenAPI spec:", error);
  process.exit(1);
}
