-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "negocioId" INTEGER;

-- CreateTable
CREATE TABLE "Negocio" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "planMaxModulos" INTEGER NOT NULL DEFAULT 3,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Negocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NegocioModulo" (
    "negocioId" INTEGER NOT NULL,
    "moduloId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NegocioModulo_pkey" PRIMARY KEY ("negocioId","moduloId")
);

-- CreateTable
CREATE TABLE "UsuarioModulo" (
    "usuarioId" INTEGER NOT NULL,
    "moduloId" TEXT NOT NULL,

    CONSTRAINT "UsuarioModulo_pkey" PRIMARY KEY ("usuarioId","moduloId")
);

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioModulo" ADD CONSTRAINT "NegocioModulo_negocioId_fkey" FOREIGN KEY ("negocioId") REFERENCES "Negocio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegocioModulo" ADD CONSTRAINT "NegocioModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioModulo" ADD CONSTRAINT "UsuarioModulo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioModulo" ADD CONSTRAINT "UsuarioModulo_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "Modulo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

