-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "settings" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Form" ("createdAt", "handle", "id", "schema", "settings", "shop", "title", "updatedAt") SELECT "createdAt", "handle", "id", "schema", "settings", "shop", "title", "updatedAt" FROM "Form";
DROP TABLE "Form";
ALTER TABLE "new_Form" RENAME TO "Form";
CREATE UNIQUE INDEX "Form_handle_key" ON "Form"("handle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
