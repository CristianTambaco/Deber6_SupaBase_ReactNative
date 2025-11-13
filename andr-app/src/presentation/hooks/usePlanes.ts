// src/presentation/hooks/usePlanes.ts
import { useState } from "react";
import { PlanEntrenamiento } from "../../domain/models/PlanEntrenamiento";
import { PlanesUseCase } from "../../domain/useCases/planes/PlanesUseCase";

const planesUseCase = new PlanesUseCase();

export function usePlanes() {
  const [planes, setPlanes] = useState<PlanEntrenamiento[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarPlanes = async (entrenadorId: string) => {
    setCargando(true);
    const data = await planesUseCase.obtenerPlanesPorEntrenador(entrenadorId);
    setPlanes(data);
    setCargando(false);
  };

  const cargarPlanesAsignados = async (usuarioId: string) => {
      setCargando(true);
      const data = await planesUseCase.obtenerPlanesAsignadosAUsuario(usuarioId);
      setPlanes(data);
      setCargando(false);
  };

  const crear = async (nombre: string, descripcion: string, entrenadorId: string, rutinasIds: string[]) => {
    const resultado = await planesUseCase.crearPlan(nombre, descripcion, entrenadorId, rutinasIds);
    if (resultado.success) {
      // await cargarPlanes(entrenadorId); // Recargar para entrenador
    }
    return resultado;
  };

  const actualizar = async (id: string, nombre: string, descripcion: string, rutinasIds: string[]) => {
    const resultado = await planesUseCase.actualizarPlan(id, nombre, descripcion, rutinasIds);
    if (resultado.success) {
      // await cargarPlanes(entrenadorId);
    }
    return resultado;
  };

  const eliminar = async (id: string) => {
    const resultado = await planesUseCase.eliminarPlan(id);
    if (resultado.success) {
      // await cargarPlanes(entrenadorId);
    }
    return resultado;
  };

  const asignarPlan = async (planId: string, usuarioId: string) => {
    return await planesUseCase.asignarPlanAUsuario(planId, usuarioId);
  };

  const desasignarPlan = async (planId: string, usuarioId: string) => {
    return await planesUseCase.desasignarPlanAUsuario(planId, usuarioId);
  };

  return {
    planes,
    cargando,
    cargarPlanes,
    cargarPlanesAsignados,
    crear,
    actualizar,
    eliminar,
    asignarPlan,
    desasignarPlan,
  };
}