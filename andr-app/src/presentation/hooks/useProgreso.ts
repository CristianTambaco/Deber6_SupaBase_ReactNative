// src/presentation/hooks/useProgreso.ts
import { useState } from "react";
import { Progreso } from "../../domain/models/Progreso";
import { ProgresoUseCase } from "../../domain/useCases/progreso/ProgresoUseCase";

const progresoUseCase = new ProgresoUseCase();

export function useProgreso() {
  const [progreso, setProgreso] = useState<Progreso[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarProgreso = async (usuarioId: string) => {
    setCargando(true);
    const data = await progresoUseCase.obtenerProgresoPorUsuario(usuarioId);
    setProgreso(data);
    setCargando(false);
  };

  const registrar = async (usuarioId: string, comentarios: string, imagenUri?: string, rutinaId?: string, planId?: string) => {
    const resultado = await progresoUseCase.registrarProgreso(usuarioId, comentarios, imagenUri, rutinaId, planId);
    if (resultado.success) {
      // await cargarProgreso(usuarioId); // Recargar para el usuario
    }
    return resultado;
  };

  const seleccionarImagen = async (): Promise<string | null> => {
    return await progresoUseCase.seleccionarImagen();
  };

  const tomarFoto = async (): Promise<string | null> => {
    return await progresoUseCase.tomarFoto();
  };

  return {
    progreso,
    cargando,
    cargarProgreso,
    registrar,
    seleccionarImagen,
    tomarFoto,
  };
}