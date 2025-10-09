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
              <div className="grid gap-3 sm:grid-cols-3">
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
                usuarios.map((usuario) => (
                  <article
                    key={usuario.id_usuario}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {usuario.nombre}
                      </h3>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="inline-flex items-center justify-center rounded-full border border-border bg-muted/70 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                        {usuario.rol?.nombre || "Rol sin asignar"}
                      </span>
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
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
