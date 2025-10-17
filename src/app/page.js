"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const initialFeedback = { type: "idle", message: "" };

export default function Dashboard() {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [paises, setPaises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(initialFeedback);

  const [roleForm, setRoleForm] = useState({ nombre: "", descripcion: "" });
  const [permisoForm, setPermisoForm] = useState({
    nombre: "",
    descripcion: "",
  });
  const [paisForm, setPaisForm] = useState({ nombre: "" });
  const [regionForm, setRegionForm] = useState({ nombre: "", paisId: "" });
  const [departamentoForm, setDepartamentoForm] = useState({
    nombre: "",
    regionId: "",
  });
  const [assignForm, setAssignForm] = useState({
    roleId: "",
    permissionId: "",
  });
  const [userForm, setUserForm] = useState({
    nombre: "",
    email: "",
    password: "",
    roleId: "",
    departamentoId: "",
  });
  const [permissionLocations, setPermissionLocations] = useState({});

  const [creatingRole, setCreatingRole] = useState(false);
  const [creatingPermiso, setCreatingPermiso] = useState(false);
  const [creatingPais, setCreatingPais] = useState(false);
  const [creatingRegion, setCreatingRegion] = useState(false);
  const [creatingDepartamento, setCreatingDepartamento] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [deletingPermisoId, setDeletingPermisoId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
  }, []);

  const loadRoles = useCallback(async () => {
    const response = await fetch("/api/roles");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No fue posible cargar los roles.");
    }

    setRoles(payload.data || []);
  }, []);

  const loadPermisos = useCallback(async () => {
    const response = await fetch("/api/permisos");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No fue posible cargar los permisos.");
    }

    setPermisos(payload.data || []);
  }, []);

  const loadPaises = useCallback(async () => {
    const response = await fetch("/api/paises");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        payload.error || "No fue posible cargar los países y regiones."
      );
    }

    setPaises(payload.data || []);
  }, []);

  const loadUsuarios = useCallback(async () => {
    const response = await fetch("/api/usuarios");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "No fue posible cargar los usuarios.");
    }

    setUsuarios(payload.data || []);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          loadRoles(),
          loadPermisos(),
          loadPaises(),
          loadUsuarios(),
        ]);
      } catch (error) {
        showFeedback(
          "error",
          error.message ||
            "Hubo un problema al cargar la información inicial."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loadRoles, loadPermisos, loadPaises, loadUsuarios, showFeedback]);

  useEffect(() => {
    if (feedback.type === "idle") {
      return;
    }

    const timer = setTimeout(() => {
      setFeedback(initialFeedback);
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  const resumen = useMemo(
    () => [
      { label: "Roles activos", value: roles.length },
      { label: "Permisos configurados", value: permisos.length },
      { label: "Usuarios registrados", value: usuarios.length },
      { label: "Países disponibles", value: paises.length },
    ],
    [roles.length, permisos.length, usuarios.length, paises.length]
  );

  const regionLookup = useMemo(() => {
    const entries = new Map();

    paises.forEach((pais) => {
      pais?.regiones?.forEach((region) => {
        entries.set(region.id_region, {
          ...region,
          id_pais: pais.id_pais,
          paisNombre: pais.nombre,
        });
      });
    });

    return entries;
  }, [paises]);

  const departamentoLookup = useMemo(() => {
    const entries = new Map();

    paises.forEach((pais) => {
      pais?.regiones?.forEach((region) => {
        region?.departamentos?.forEach((departamento) => {
          entries.set(departamento.id_departamento, {
            ...departamento,
            id_region: region.id_region,
            id_pais: pais.id_pais,
            regionNombre: region.nombre,
            paisNombre: pais.nombre,
          });
        });
      });
    });

    return entries;
  }, [paises]);

  const regionOptions = useMemo(
    () =>
      Array.from(regionLookup.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ),
    [regionLookup]
  );

  const departamentoOptions = useMemo(
    () =>
      Array.from(departamentoLookup.values()).sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      ),
    [departamentoLookup]
  );

  const togglePermissionLocation = useCallback((permissionId, locationKey) => {
    setPermissionLocations((prev) => {
      const current = new Set(prev[permissionId] || []);

      if (current.has(locationKey)) {
        current.delete(locationKey);
      } else {
        if (locationKey === "global") {
          current.clear();
          current.add("global");
        } else {
          current.delete("global");
          current.add(locationKey);
        }
      }

      if (current.size === 0) {
        const { [permissionId]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [permissionId]: Array.from(current),
      };
    });
  }, []);

  const isLocationSelected = useCallback(
    (permissionId, locationKey) =>
      Boolean(permissionLocations[permissionId]?.includes(locationKey)),
    [permissionLocations]
  );

  const getScopeLabel = useCallback((assignment) => {
    if (!assignment) {
      return "Global";
    }

    const departamento = assignment.departamento;
    const region =
      departamento?.region || assignment.region || null;
    const pais =
      departamento?.region?.pais ||
      assignment.region?.pais ||
      assignment.pais ||
      null;

    if (departamento?.nombre) {
      const parts = [`Departamento ${departamento.nombre}`];

      if (region?.nombre) {
        parts.push(`Región ${region.nombre}`);
      }

      if (pais?.nombre) {
        parts.push(`País ${pais.nombre}`);
      }

      return parts.join(" · ");
    }

    if (region?.nombre) {
      const parts = [`Región ${region.nombre}`];

      if (pais?.nombre) {
        parts.push(`País ${pais.nombre}`);
      }

      return parts.join(" · ");
    }

    if (pais?.nombre) {
      return `País ${pais.nombre}`;
    }

    return "Global";
  }, []);

  const handleCreateRole = async (event) => {
    event.preventDefault();
    setCreatingRole(true);

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadRoles();
      setRoleForm({ nombre: "", descripcion: "" });
      showFeedback("success", "Rol creado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No se pudo crear el rol. Inténtalo de nuevo."
      );
    } finally {
      setCreatingRole(false);
    }
  };

  const handleCreatePermiso = async (event) => {
    event.preventDefault();
    setCreatingPermiso(true);

    try {
      const response = await fetch("/api/permisos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(permisoForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadPermisos();
      setPermisoForm({ nombre: "", descripcion: "" });
      showFeedback("success", "Permiso creado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No se pudo crear el permiso. Inténtalo de nuevo."
      );
    } finally {
      setCreatingPermiso(false);
    }
  };

  const handleCreatePais = async (event) => {
    event.preventDefault();
    setCreatingPais(true);

    try {
      const response = await fetch("/api/paises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paisForm),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadPaises();
      setPaisForm({ nombre: "" });
      showFeedback("success", "País registrado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible registrar el país."
      );
    } finally {
      setCreatingPais(false);
    }
  };

  const handleCreateRegion = async (event) => {
    event.preventDefault();
    setCreatingRegion(true);

    try {
      if (!regionForm.paisId) {
        throw new Error("Selecciona el país al que pertenece la región.");
      }

      const response = await fetch("/api/regiones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: regionForm.nombre,
          paisId: Number(regionForm.paisId),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadPaises();
      setRegionForm({ nombre: "", paisId: "" });
      showFeedback("success", "Región registrada correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible registrar la región."
      );
    } finally {
      setCreatingRegion(false);
    }
  };

  const handleCreateDepartamento = async (event) => {
    event.preventDefault();
    setCreatingDepartamento(true);

    try {
      if (!departamentoForm.regionId) {
        throw new Error("Selecciona la región a la que pertenece el departamento.");
      }

      const response = await fetch("/api/departamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: departamentoForm.nombre,
          regionId: Number(departamentoForm.regionId),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadPaises();
      setDepartamentoForm({ nombre: "", regionId: "" });
      showFeedback("success", "Departamento registrado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible registrar el departamento."
      );
    } finally {
      setCreatingDepartamento(false);
    }
  };

  const handleAssignPermission = async (event) => {
    event.preventDefault();

    if (!assignForm.roleId || !assignForm.permissionId) {
      showFeedback("error", "Selecciona un rol y un permiso antes de asignar.");
      return;
    }

    setAssigning(true);

    try {
      const response = await fetch("/api/roles/asignar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: Number(assignForm.roleId),
          permissionId: Number(assignForm.permissionId),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      const updatedRole = payload.data;

      setRoles((current) =>
        current.map((role) =>
          role.id_rol === updatedRole.id_rol ? updatedRole : role
        )
      );
      setAssignForm({ roleId: "", permissionId: "" });
      showFeedback("success", "Permiso asignado al rol.");
    } catch (error) {
      showFeedback(
        "error",
        error.message ||
          "No se pudo asignar el permiso. Inténtalo nuevamente."
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find((item) => item.id_rol === roleId);
    if (role?.permisos?.length) {
      showFeedback(
        "error",
        "No puedes eliminar un rol que todavía tiene permisos asignados."
      );
      return;
    }

    setDeletingRoleId(roleId);

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      setRoles((current) =>
        current.filter((roleItem) => roleItem.id_rol !== roleId)
      );
      showFeedback("success", "Rol eliminado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible eliminar el rol."
      );
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleDeletePermiso = async (permisoId) => {
    setDeletingPermisoId(permisoId);

    try {
      const response = await fetch(`/api/permisos/${permisoId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await Promise.all([loadPermisos(), loadRoles()]);
      setPermissionLocations((current) => {
        if (!current[permisoId]) {
          return current;
        }

        const { [permisoId]: _removed, ...rest } = current;
        return rest;
      });
      showFeedback(
        "success",
        "Permiso eliminado y retirado de los roles asociados."
      );
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible eliminar el permiso."
      );
    } finally {
      setDeletingPermisoId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setDeletingUserId(userId);

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      setUsuarios((current) =>
        current.filter((usuario) => usuario.id_usuario !== userId)
      );
      showFeedback("success", "Usuario eliminado correctamente.");
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible eliminar el usuario."
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreatingUser(true);

    try {
      const scopesPayload = [];

      Object.entries(permissionLocations).forEach(
        ([permissionId, entries]) => {
          const numericPermissionId = Number(permissionId);

          if (!numericPermissionId || Number.isNaN(numericPermissionId)) {
            return;
          }

          entries.forEach((entry) => {
            if (entry === "global") {
              scopesPayload.push({
                permissionId: numericPermissionId,
              });
              return;
            }

            const [scopeType, scopeIdValue] = entry.split(":");
            const scopeId = Number(scopeIdValue);

            if (!scopeType || !scopeId || Number.isNaN(scopeId)) {
              return;
            }

            if (scopeType === "pais") {
              scopesPayload.push({
                permissionId: numericPermissionId,
                paisId: scopeId,
              });
            } else if (scopeType === "region") {
              const region = regionLookup.get(scopeId);
              scopesPayload.push({
                permissionId: numericPermissionId,
                paisId: region?.id_pais ?? null,
                regionId: scopeId,
              });
            } else if (scopeType === "departamento") {
              const departamento = departamentoLookup.get(scopeId);
              scopesPayload.push({
                permissionId: numericPermissionId,
                paisId: departamento?.id_pais ?? null,
                regionId: departamento?.id_region ?? null,
                departamentoId: scopeId,
              });
            }
          });
        }
      );

      const dedupedScopes = Array.from(
        new Map(
          scopesPayload.map((scope) => [
            [
              scope.permissionId,
              scope.paisId ?? "null",
              scope.regionId ?? "null",
              scope.departamentoId ?? "null",
            ].join(":"),
            scope,
          ])
        ).values()
      );

      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userForm,
          roleId: Number(userForm.roleId),
          departamentoId: userForm.departamentoId
            ? Number(userForm.departamentoId)
            : null,
          scopes: dedupedScopes,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadUsuarios();
      setUserForm({
        nombre: "",
        email: "",
        password: "",
        roleId: "",
        departamentoId: "",
      });
      setPermissionLocations({});
      showFeedback("success", "Usuario creado y rol asignado.");
    } catch (error) {
      showFeedback(
        "error",
        error.message ||
          "No se pudo crear el usuario. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-primary/35 via-secondary/25 to-transparent blur-3xl opacity-70" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 lg:px-8">
          <header className="rounded-3xl border border-border bg-card/80 p-8 shadow-[0_25px_60px_-35px_rgba(15,149,142,0.45)] backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="uppercase tracking-[0.35em] text-xs text-primary">
                  Escuela de pilotos
                </p>
                <h1 className="mt-4 text-4xl font-semibold text-foreground sm:text-5xl">
                  Panel de roles, permisos y usuarios
                </h1>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {resumen.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-center shadow-inner"
                  >
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-3xl font-semibold text-foreground">
                      {isLoading ? "—" : item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {feedback.type !== "idle" && (
            <div
              className={`rounded-2xl border px-6 py-4 text-sm shadow-lg ${
                feedback.type === "error"
                  ? "border-destructive/60 bg-destructive/15 text-destructive-foreground"
                  : "border-primary/50 bg-primary/10 text-primary"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-border bg-card/65 px-6 py-4 text-sm text-muted-foreground">
              Cargando información del panel...
            </div>
          )}

          <main className="grid gap-10 lg:grid-cols-[1fr,1fr]">
            <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card/60 p-6 shadow-[0_20px_40px_-30px_rgba(16,122,106,0.45)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Gestión de roles
                </h2>
                <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                  {roles.length} roles
                </span>
              </div>

              <form
                className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                onSubmit={handleCreateRole}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Crear nuevo rol
                </p>
                <input
                  required
                  value={roleForm.nombre}
                  onChange={(event) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Nombre del rol (ej. Instructor)"
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
                <textarea
                  value={roleForm.descripcion}
                  onChange={(event) =>
                    setRoleForm((prev) => ({
                      ...prev,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Descripción del rol"
                  rows={2}
                  className="resize-none rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {creatingRole ? "Creando rol..." : "Guardar rol"}
                </button>
              </form>

              <div className="grid gap-4">
                {roles.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-border bg-card/70 px-4 py-6 text-center text-sm text-muted-foreground">
                    Aún no hay roles registrados.
                  </p>
                ) : (
                  roles.map((role) => (
                    <article
                      key={role.id_rol}
                      className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {role.nombre}
                          </h3>
                          {role.descripcion && (
                            <p className="text-sm text-muted-foreground">
                              {role.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="rounded-full border border-border bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
                            {role.permisos?.length || 0} permisos
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role.id_rol)}
                            disabled={
                              deletingRoleId === role.id_rol ||
                              (role.permisos?.length || 0) > 0
                            }
                            title={
                              role.permisos?.length
                                ? "Elimina los permisos asignados antes de borrar este rol."
                                : "Eliminar rol"
                            }
                            className="rounded-lg border border-destructive/60 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:border-destructive/30 disabled:text-destructive/50 disabled:hover:bg-transparent"
                          >
                            {deletingRoleId === role.id_rol
                              ? "Eliminando..."
                              : "Eliminar rol"}
                          </button>
                        </div>
                      </div>

                      {role.permisos?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {role.permisos.map((rel) => (
                            <span
                              key={`${rel.id_rol}-${rel.id_permiso}`}
                              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary/80"
                            >
                              {rel.permiso?.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          No hay permisos asignados todavía.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card/60 p-6 shadow-[0_20px_40px_-30px_rgba(16,122,106,0.45)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Permisos disponibles
                </h2>
                <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                  {permisos.length} permisos
                </span>
              </div>

              <form
                className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                onSubmit={handleCreatePermiso}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Crear permiso
                </p>
                <input
                  required
                  value={permisoForm.nombre}
                  onChange={(event) =>
                    setPermisoForm((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Nombre del permiso (ej. Crear aeronaves)"
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                />
                <textarea
                  value={permisoForm.descripcion}
                  onChange={(event) =>
                    setPermisoForm((prev) => ({
                      ...prev,
                      descripcion: event.target.value,
                    }))
                  }
                  placeholder="Descripción del permiso"
                  rows={2}
                  className="resize-none rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                />
                <button
                  type="submit"
                  disabled={creatingPermiso}
                  className="flex items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-secondary/60"
                >
                  {creatingPermiso ? "Creando permiso..." : "Guardar permiso"}
                </button>
              </form>

              <form
                className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                onSubmit={handleAssignPermission}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Asignar permiso a un rol
                </p>
                <select
                  value={assignForm.roleId}
                  onChange={(event) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      roleId: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id_rol} value={role.id_rol}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={assignForm.permissionId}
                  onChange={(event) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      permissionId: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/40"
                >
                  <option value="">Selecciona un permiso</option>
                  {permisos.map((permiso) => (
                    <option key={permiso.id_permiso} value={permiso.id_permiso}>
                      {permiso.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                >
                  {assigning ? "Asignando permiso..." : "Asignar permiso"}
                </button>
              </form>

              <div className="grid gap-4">
                {permisos.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-border bg-card/70 px-4 py-6 text-center text-sm text-muted-foreground">
                    Aún no hay permisos registrados.
                  </p>
                ) : (
                  permisos.map((permiso) => (
                    <article
                      key={permiso.id_permiso}
                      className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {permiso.nombre}
                          </h3>
                          {permiso.descripcion && (
                            <p className="text-sm text-muted-foreground">
                              {permiso.descripcion}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start gap-2 sm:items-end">
                          <span className="rounded-full border border-border bg-muted/70 px-3 py-1 text-xs text-muted-foreground">
                            {permiso.roles?.length || 0} roles
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePermiso(permiso.id_permiso)}
                            disabled={deletingPermisoId === permiso.id_permiso}
                            title="Eliminar permiso"
                            className="rounded-lg border border-destructive/60 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:border-destructive/30 disabled:text-destructive/50 disabled:hover:bg-transparent"
                          >
                            {deletingPermisoId === permiso.id_permiso
                              ? "Eliminando..."
                              : "Eliminar permiso"}
                          </button>
                        </div>
                      </div>
                      {permiso.roles?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {permiso.roles.map((rel) => (
                            <span
                              key={`${rel.id_permiso}-${rel.id_rol}`}
                              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
                            >
                              {rel.rol?.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Ningún rol utiliza este permiso todavía.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-6 rounded-3xl border border-border bg-card/60 p-6 shadow-[0_20px_40px_-30px_rgba(16,122,106,0.45)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Ubicaciones geográficas
                </h2>
                <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                  {paises.length} países
                </span>
              </div>

              <div className="grid gap-4">
                <form
                  className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                  onSubmit={handleCreatePais}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    Registrar país
                  </p>
                  <input
                    required
                    value={paisForm.nombre}
                    onChange={(event) =>
                      setPaisForm({ nombre: event.target.value })
                    }
                    placeholder="Nombre del país"
                    className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="submit"
                    disabled={creatingPais}
                    className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {creatingPais ? "Guardando país..." : "Guardar país"}
                  </button>
                </form>

                <form
                  className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                  onSubmit={handleCreateRegion}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    Registrar región
                  </p>
                  <input
                    required
                    value={regionForm.nombre}
                    onChange={(event) =>
                      setRegionForm((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Nombre de la región"
                    className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  />
                  <select
                    required
                    value={regionForm.paisId}
                    onChange={(event) =>
                      setRegionForm((prev) => ({
                        ...prev,
                        paisId: event.target.value,
                      }))
                    }
                    disabled={paises.length === 0}
                    className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Selecciona un país</option>
                    {paises.map((pais) => (
                      <option key={pais.id_pais} value={pais.id_pais}>
                        {pais.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={creatingRegion || paises.length === 0}
                    className="flex items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-secondary/60"
                  >
                    {creatingRegion ? "Guardando región..." : "Guardar región"}
                  </button>
                </form>

                <form
                  className="grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
                  onSubmit={handleCreateDepartamento}
                >
                  <p className="text-sm font-medium text-muted-foreground">
                    Registrar departamento
                  </p>
                  <input
                    required
                    value={departamentoForm.nombre}
                    onChange={(event) =>
                      setDepartamentoForm((prev) => ({
                        ...prev,
                        nombre: event.target.value,
                      }))
                    }
                    placeholder="Nombre del departamento"
                    className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40"
                  />
                  <select
                    required
                    value={departamentoForm.regionId}
                    onChange={(event) =>
                      setDepartamentoForm((prev) => ({
                        ...prev,
                        regionId: event.target.value,
                      }))
                    }
                    disabled={regionOptions.length === 0}
                    className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Selecciona una región</option>
                    {regionOptions.map((region) => (
                      <option key={region.id_region} value={region.id_region}>
                        {region.nombre} — {region.paisNombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={
                      creatingDepartamento || regionOptions.length === 0
                    }
                    className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
                  >
                    {creatingDepartamento
                      ? "Guardando departamento..."
                      : "Guardar departamento"}
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <p className="rounded-2xl border border-border bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                    Cargando ubicaciones...
                  </p>
                ) : paises.length === 0 ? (
                  <p className="rounded-2xl border border-border bg-card/70 px-4 py-4 text-sm text-muted-foreground">
                    Aún no hay países registrados.
                  </p>
                ) : (
                  paises.map((pais) => (
                    <article
                      key={pais.id_pais}
                      className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {pais.nombre}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {pais.regiones?.length || 0} regiones registradas
                          </p>
                        </div>
                      </div>
                      {pais.regiones?.length ? (
                        <div className="mt-4 space-y-3">
                          {pais.regiones.map((region) => (
                            <div
                              key={region.id_region}
                              className="rounded-xl border border-border/80 bg-background/60 p-4"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-sm font-medium text-foreground">
                                  {region.nombre}
                                </p>
                                <span className="rounded-full border border-border bg-muted/70 px-3 py-1 text-[11px] text-muted-foreground">
                                  {region.departamentos?.length || 0} departamentos
                                </span>
                              </div>
                              {region.departamentos?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {region.departamentos.map((departamento) => (
                                    <span
                                      key={departamento.id_departamento}
                                      className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary/90"
                                    >
                                      {departamento.nombre}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-3 text-xs text-muted-foreground">
                                  No hay departamentos para esta región.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          No hay regiones registradas para este país.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </main>

          <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-[0_20px_40px_-30px_rgba(16,122,106,0.45)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Usuarios del sistema
                </h2>
                <p className="text-sm text-muted-foreground">
                  Crea cuentas y vincula cada usuario con el rol adecuado.
                </p>
              </div>
              <span className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
                {usuarios.length} usuarios
              </span>
            </div>

            <form
              className="mt-6 grid gap-3 rounded-2xl border border-border bg-card/70 p-5"
              onSubmit={handleCreateUser}
            >
              <p className="text-sm font-medium text-muted-foreground">
                Registrar nuevo usuario
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={userForm.nombre}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      nombre: event.target.value,
                    }))
                  }
                  placeholder="Nombre completo"
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/35"
                />
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Correo electrónico"
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/35"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr,220px]">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Contraseña (mínimo 8 caracteres)"
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/35"
                />
                <select
                  value={userForm.roleId}
                  onChange={(event) =>
                    setUserForm((prev) => ({
                      ...prev,
                      roleId: event.target.value,
                    }))
                  }
                  required
                  className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/35"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id_rol} value={role.id_rol}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={userForm.departamentoId}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    departamentoId: event.target.value,
                  }))
                }
                disabled={departamentoOptions.length === 0}
                className="rounded-xl border border-border bg-muted/70 px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Departamento principal (opcional)</option>
                {departamentoOptions.map((departamento) => (
                  <option
                    key={departamento.id_departamento}
                    value={departamento.id_departamento}
                  >
                    {departamento.nombre} — {departamento.regionNombre},{" "}
                    {departamento.paisNombre}
                  </option>
                ))}
              </select>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      Permisos por ubicación
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Marca los permisos necesarios y define su alcance por país,
                      región o departamento. Puedes combinar múltiples opciones.
                    </p>
                  </div>
                  <span className="rounded-full border border-border bg-muted/70 px-3 py-1 text-[11px] text-muted-foreground">
                    {permisos.length} permisos disponibles
                  </span>
                </div>
                {permisos.length === 0 ? (
                  <p className="mt-4 rounded-xl border border-dashed border-border/70 bg-card/50 px-4 py-3 text-xs text-muted-foreground">
                    Registra permisos antes de asignarlos a usuarios.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {permisos.map((permiso) => (
                      <div
                        key={permiso.id_permiso}
                        className="rounded-xl border border-border/80 bg-background/60 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {permiso.nombre}
                            </p>
                            {permiso.descripcion && (
                              <p className="text-xs text-muted-foreground">
                                {permiso.descripcion}
                              </p>
                            )}
                          </div>
                          <label className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                              checked={isLocationSelected(
                                permiso.id_permiso,
                                "global"
                              )}
                              onChange={() =>
                                togglePermissionLocation(
                                  permiso.id_permiso,
                                  "global"
                                )
                              }
                            />
                            Acceso global
                          </label>
                        </div>
                        <div className="mt-4 space-y-3">
                          {paises.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-border/60 bg-card/40 px-3 py-2 text-xs text-muted-foreground">
                              Registra países para habilitar la asignación por
                              ubicación.
                            </p>
                          ) : (
                            paises.map((pais) => (
                              <div
                                key={`${permiso.id_permiso}-pais-${pais.id_pais}`}
                                className="rounded-lg border border-border/60 bg-card/40 p-3"
                              >
                                <label className="flex items-center gap-2 text-sm text-foreground">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                                    checked={isLocationSelected(
                                      permiso.id_permiso,
                                      `pais:${pais.id_pais}`
                                    )}
                                    onChange={() =>
                                      togglePermissionLocation(
                                        permiso.id_permiso,
                                        `pais:${pais.id_pais}`
                                      )
                                    }
                                  />
                                  {pais.nombre}
                                </label>
                                <div className="mt-3 space-y-2 pl-6">
                                  {pais.regiones?.length ? (
                                    pais.regiones.map((region) => (
                                      <div
                                        key={`${permiso.id_permiso}-region-${region.id_region}`}
                                        className="rounded-lg border border-border/40 bg-background/40 p-3"
                                      >
                                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                                            checked={isLocationSelected(
                                              permiso.id_permiso,
                                              `region:${region.id_region}`
                                            )}
                                            onChange={() =>
                                              togglePermissionLocation(
                                                permiso.id_permiso,
                                                `region:${region.id_region}`
                                              )
                                            }
                                          />
                                          {region.nombre}
                                        </label>
                                        <div className="mt-2 flex flex-wrap gap-2 pl-6">
                                          {region.departamentos?.length ? (
                                            region.departamentos.map(
                                              (departamento) => (
                                                <label
                                                  key={`${permiso.id_permiso}-departamento-${departamento.id_departamento}`}
                                                  className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-3 py-1 text-[11px] text-muted-foreground"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/40"
                                                    checked={isLocationSelected(
                                                      permiso.id_permiso,
                                                      `departamento:${departamento.id_departamento}`
                                                    )}
                                                    onChange={() =>
                                                      togglePermissionLocation(
                                                        permiso.id_permiso,
                                                        `departamento:${departamento.id_departamento}`
                                                      )
                                                    }
                                                  />
                                                  {departamento.nombre}
                                                </label>
                                              )
                                            )
                                          ) : (
                                            <p className="text-[11px] text-muted-foreground">
                                              Sin departamentos registrados.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      Sin regiones registradas.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={creatingUser}
                className="mt-2 flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
              >
                {creatingUser ? "Creando usuario..." : "Registrar usuario"}
              </button>
            </form>

            <div className="mt-6 grid gap-4">
              {usuarios.length === 0 && !isLoading ? (
                <p className="rounded-2xl border border-border bg-card/70 px-4 py-6 text-center text-sm text-muted-foreground">
                  Aún no hay usuarios registrados.
                </p>
              ) : (
                usuarios.map((usuario) => {
                  const permissionGroups = new Map();

                  usuario.permisos?.forEach((asignacion) => {
                    const permisoNombre =
                      asignacion.permiso?.nombre ||
                      `Permiso ${asignacion.id_permiso}`;
                    const label = getScopeLabel(asignacion);

                    if (!permissionGroups.has(permisoNombre)) {
                      permissionGroups.set(permisoNombre, new Set());
                    }

                    permissionGroups.get(permisoNombre).add(label);
                  });

                  return (
                    <article
                      key={usuario.id_usuario}
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            {usuario.nombre}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {usuario.email}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-3 py-1">
                            {usuario.rol?.nombre || "Rol sin asignar"}
                          </span>
                          {usuario.departamento?.nombre && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-3 py-1">
                              Departamento {usuario.departamento.nombre}
                            </span>
                          )}
                          {usuario.departamento?.region?.nombre && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-3 py-1">
                              Región {usuario.departamento.region.nombre}
                            </span>
                          )}
                          {usuario.departamento?.region?.pais?.nombre && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/60 px-3 py-1">
                              País {usuario.departamento.region.pais.nombre}
                            </span>
                          )}
                        </div>
                        {permissionGroups.size ? (
                          <div className="space-y-2">
                            {[...permissionGroups.entries()].map(
                              ([permisoNombre, labels]) => (
                                <div
                                  key={`${usuario.id_usuario}-${permisoNombre}`}
                                >
                                  <p className="text-xs font-medium text-foreground">
                                    {permisoNombre}
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-2">
                                    {[...labels].map((label) => (
                                      <span
                                        key={`${usuario.id_usuario}-${permisoNombre}-${label}`}
                                        className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] text-primary/90"
                                      >
                                        {label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Sin permisos específicos asignados.
                          </p>
                        )}
                      </div>
                      <div className="flex items-start gap-3 sm:flex-col sm:items-end sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(usuario.id_usuario)}
                          disabled={deletingUserId === usuario.id_usuario}
                          className="rounded-lg border border-destructive/60 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:border-destructive/30 disabled:text-destructive/50 disabled:hover:bg-transparent"
                        >
                          {deletingUserId === usuario.id_usuario
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
