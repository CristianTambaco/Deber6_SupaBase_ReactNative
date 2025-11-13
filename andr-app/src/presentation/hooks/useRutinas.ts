// src/presentation/hooks/useRutinas.ts
import { useEffect, useState } from "react";
import { Rutina } from "../../domain/models/Rutina";
import { RutinasUseCase } from "../../domain/useCases/rutinas/RutinasUseCase";

const rutinasUseCase = new RutinasUseCase();

export function useRutinas() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [cargando, setCargando] = useState(true);

  // useEffect(() => {
  //   // Cargar rutinas según el rol del usuario actual
  //   // Por ejemplo, si es entrenador, cargar sus propias rutinas
  //   // Si es usuario, cargar las asignadas
  //   // Esto requiere acceso al hook useAuth o pasar el usuario como parámetro
  //   // cargarRutinas("entrenador-id-actual");
  // }, []);

  const cargarRutinas = async (entrenadorId: string) => {
    setCargando(true);
    const data = await rutinasUseCase.obtenerRutinasPorEntrenador(entrenadorId);
    setRutinas(data);
    setCargando(false);
  };

  const cargarRutinasAsignadas = async (usuarioId: string) => {
      setCargando(true);
      const data = await rutinasUseCase.obtenerRutinasAsignadasAUsuario(usuarioId);
      setRutinas(data);
      setCargando(false);
  };

  const crear = async (titulo: string, descripcion: string, entrenadorId: string) => {
    const resultado = await rutinasUseCase.crearRutina(titulo, descripcion, entrenadorId);
    if (resultado.success) {
      // Recargar lista o actualizar estado
      // await cargarRutinas(entrenadorId); // Recargar para entrenador
    }
    return resultado;
  };

  const actualizar = async (id: string, titulo: string, descripcion: string) => {
    const resultado = await rutinasUseCase.actualizarRutina(id, titulo, descripcion);
    if (resultado.success) {
      // Recargar lista o actualizar estado
      // await cargarRutinas(entrenadorId);
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await rutinasUseCase.eliminarRutina(id);
    if (resultado.success) {
      // Recargar lista o actualizar estado
      // await cargarRutinas(entrenadorId);
    }
    return resultado;
  };

  // Métodos para subida de archivos
  const subirVideoDemostrativo = async (uri: string) => {
    return await rutinasUseCase.subirVideoDemostrativo(uri);
  };

  const subirFotoProgreso = async (uri: string) => {
      return await rutinasUseCase.subirFotoProgreso(uri);
  };

  const seleccionarVideo = async (): Promise<string | null> => {
    return await rutinasUseCase.seleccionarVideo();
  };

  const seleccionarImagen = async (): Promise<string | null> => {
    return await rutinasUseCase.seleccionarImagen();
  };

  const tomarFoto = async (): Promise<string | null> => {
    return await rutinasUseCase.tomarFoto();
  };

  return {
    rutinas,
    cargando,
    cargarRutinas,
    cargarRutinasAsignadas,
    crear,
    actualizar,
    eliminar,
    subirVideoDemostrativo,
    subirFotoProgreso,
    seleccionarVideo,
    seleccionarImagen,
    tomarFoto,
  };
}