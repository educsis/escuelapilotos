"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const initialFeedback = { type: "idle", message: "" };

export default function Dashboard() {
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(initialFeedback);

  const [roleForm, setRoleForm] = useState({ nombre: "", descripcion: "" });
  const [permisoForm, setPermisoForm] = useState({
    nombre: "",
    descripcion: "",
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
  });

  const [creatingRole, setCreatingRole] = useState(false);
  const [creatingPermiso, setCreatingPermiso] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

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
        await Promise.all([loadRoles(), loadPermisos(), loadUsuarios()]);
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
  }, [loadRoles, loadPermisos, loadUsuarios, showFeedback]);

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
    ],
    [roles.length, permisos.length, usuarios.length]
  );

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

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreatingUser(true);

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userForm,
          roleId: Number(userForm.roleId),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error);
      }

      await loadUsuarios();
      setUserForm({ nombre: "", email: "", password: "", roleId: "" });
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-sky-500/40 via-indigo-500/20 to-transparent blur-3xl opacity-50" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 lg:px-8">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.9)] backdrop-blur">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="uppercase tracking-[0.35em] text-xs text-sky-300">
                  Escuela de pilotos
                </p>
                <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                  Panel de roles, permisos y usuarios
                </h1>
                <p className="mt-3 max-w-3xl text-base text-slate-300">
                  Centraliza la gestión de perfiles de acceso, asigna permisos a
                  cada rol y crea cuentas para tu equipo en un entorno sencillo
                  y elegante.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {resumen.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-center shadow-inner"
                  >
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="text-3xl font-semibold text-white">
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
                  ? "border-rose-500/60 bg-rose-500/15 text-rose-100"
                  : "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-4 text-sm text-slate-300">
              Cargando información del panel...
            </div>
          )}

          <main className="grid gap-10 lg:grid-cols-[1fr,1fr]">
            <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,1)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">
                  Gestión de roles
                </h2>
                <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                  {roles.length} roles
                </span>
              </div>

              <form
                className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                onSubmit={handleCreateRole}
              >
                <p className="text-sm font-medium text-slate-200">
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
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
                  className="resize-none rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
                />
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-500/60"
                >
                  {creatingRole ? "Creando rol..." : "Guardar rol"}
                </button>
              </form>

              <div className="grid gap-4">
                {roles.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-300">
                    Aún no hay roles registrados.
                  </p>
                ) : (
                  roles.map((role) => (
                    <article
                      key={role.id_rol}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {role.nombre}
                          </h3>
                          {role.descripcion && (
                            <p className="text-sm text-slate-300">
                              {role.descripcion}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                          {role.permisos?.length || 0} permisos
                        </span>
                      </div>

                      {role.permisos?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {role.permisos.map((rel) => (
                            <span
                              key={`${rel.id_rol}-${rel.id_permiso}`}
                              className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-200"
                            >
                              {rel.permiso?.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-400">
                          No hay permisos asignados todavía.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,1)] backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-white">
                  Permisos disponibles
                </h2>
                <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                  {permisos.length} permisos
                </span>
              </div>

              <form
                className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                onSubmit={handleCreatePermiso}
              >
                <p className="text-sm font-medium text-slate-200">
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
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
                  className="resize-none rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={creatingPermiso}
                  className="flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-500/60"
                >
                  {creatingPermiso ? "Creando permiso..." : "Guardar permiso"}
                </button>
              </form>

              <form
                className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                onSubmit={handleAssignPermission}
              >
                <p className="text-sm font-medium text-slate-200">
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
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
                  className="flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
                >
                  {assigning ? "Asignando permiso..." : "Asignar permiso"}
                </button>
              </form>

              <div className="grid gap-4">
                {permisos.length === 0 && !isLoading ? (
                  <p className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-300">
                    Aún no hay permisos registrados.
                  </p>
                ) : (
                  permisos.map((permiso) => (
                    <article
                      key={permiso.id_permiso}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {permiso.nombre}
                          </h3>
                          {permiso.descripcion && (
                            <p className="text-sm text-slate-300">
                              {permiso.descripcion}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
                          {permiso.roles?.length || 0} roles
                        </span>
                      </div>
                      {permiso.roles?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {permiso.roles.map((rel) => (
                            <span
                              key={`${rel.id_permiso}-${rel.id_rol}`}
                              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100"
                            >
                              {rel.rol?.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-400">
                          Ningún rol utiliza este permiso todavía.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </main>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_20px_40px_-30px_rgba(15,23,42,1)] backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Usuarios del sistema
                </h2>
                <p className="text-sm text-slate-300">
                  Crea cuentas y vincula cada usuario con el rol adecuado.
                </p>
              </div>
              <span className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-300">
                {usuarios.length} usuarios
              </span>
            </div>

            <form
              className="mt-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
              onSubmit={handleCreateUser}
            >
              <p className="text-sm font-medium text-slate-200">
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
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
                  className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">Selecciona un rol</option>
                  {roles.map((role) => (
                    <option key={role.id_rol} value={role.id_rol}>
                      {role.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={creatingUser}
                className="mt-2 flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
              >
                {creatingUser ? "Creando usuario..." : "Registrar usuario"}
              </button>
            </form>

            <div className="mt-6 grid gap-4">
              {usuarios.length === 0 && !isLoading ? (
                <p className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-300">
                  Aún no hay usuarios registrados.
                </p>
              ) : (
                usuarios.map((usuario) => (
                  <article
                    key={usuario.id_usuario}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {usuario.nombre}
                      </h3>
                      <p className="text-sm text-slate-300">{usuario.email}</p>
                    </div>
                    <span className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-950/70 px-4 py-1.5 text-xs font-medium text-slate-200">
                      {usuario.rol?.nombre || "Rol sin asignar"}
                    </span>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

