
import { MonthlyDue, UserProfile, PaymentRecord, UserGroup, LaborEvent, Poll, PollResponse, GroupType, NewsPost, KnowledgeBaseItem } from "../types";

/**
 * CACHÉ DE MAPEO DE CAMPOS DETECTADOS
 */
let FIELD_CACHE: Record<string, Record<string, string>> = {
  Afiliados: {},
  Eventos: {},
  Grupos: {},
  Pagos: {},
  Entrenamiento_IA: {}
};

/**
 * HELPER: Busca un valor en un objeto ignorando mayúsculas, espacios y acentos de forma exhaustiva.
 */
const findAndMap = (recordFields: any, tableName: string, internalKey: string, possibilities: string[]) => {
  const recordKeys = Object.keys(recordFields);
  const normalize = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  for (const p of possibilities) {
    const normalizedP = normalize(p);
    const match = recordKeys.find(rk => normalize(rk) === normalizedP);
    if (match) {
      if (!FIELD_CACHE[tableName]) FIELD_CACHE[tableName] = {};
      FIELD_CACHE[tableName][internalKey] = match;
      return recordFields[match];
    }
  }
  return undefined;
};

const mapAirtableToProfile = (record: any): UserProfile => {
  const f = record.fields;
  const T = "Afiliados";
  return {
    id: record.id,
    fullName: findAndMap(f, T, "fullName", ['fullName', 'Nombre', 'nombre', 'Nombre Completo', 'Nombre_Completo', 'Trabajador']) || "",
    employeeId: String(findAndMap(f, T, "employeeId", ['Plaza', 'plaza', 'employeeId', 'Número de Plaza', 'No. de Plaza', 'No_Plaza', 'NoPlaza', 'NumPlaza']) || ""),
    email_unach: findAndMap(f, T, "email_unach", ['Correo_unach', 'email', 'Correo Institucional', 'correo', 'email_unach', 'Correo', 'Email', 'E-mail']) || "",
    nickname: findAndMap(f, T, "nickname", ['nickname', 'Nickname', 'Usuario', 'user', 'Nick', 'ID']) || "",
    password_hash: findAndMap(f, T, "password_hash", ['password_hash', 'password', 'clave', 'Contraseña', 'Pass']) || "",
    status: findAndMap(f, T, "status", ['status', 'Estatus', 'Situación', 'Situacion', 'status_laboral', 'Estado', 'Condicion']) || "Activo",
    role: Array.isArray(f['role']) ? f['role'][0] : (findAndMap(f, T, "role", ['role', 'Rol', 'Puesto', 'rol_sindical', 'Cargo', 'Nivel']) || "Afiliado"),
    dependencia: findAndMap(f, T, "dependencia", ['dependencia', 'Dependencia', 'area', 'Área', 'Adscripción', 'adscripcion', 'Unidad', 'Lugar de Trabajo']) || "",
    area: findAndMap(f, T, "area", ['area', 'Área', 'dependencia', 'Dependencia']) || "",
    rfc: findAndMap(f, T, "rfc", ['rfc', 'RFC', 'RFC Oficial', 'Rfc', 'R.F.C.']) || "",
    direccion: findAndMap(f, T, "direccion", ['domicilio', 'domicilio_particular', 'direccion', 'Direccion', 'Domicilio', 'Domicilio Particular', 'Calle', 'Residencia']) || "",
    phone: findAndMap(f, T, "phone", ['phone', 'teléfono', 'tel', 'telefono', 'Celular', 'Contacto']) || "",
    curp: findAndMap(f, T, "curp", ['curp', 'CURP', 'Curp', 'C.U.R.P.']) || "",
    puesto: findAndMap(f, T, "puesto", ['puesto', 'Cargo', 'Puesto Nominal', 'Funcion']) || "",
    nivel: findAndMap(f, T, "nivel", ['nivel', 'Nivel', 'Nivel Salarial', 'Categoria']) || "",
    fotoUrl: findAndMap(f, T, "fotoUrl", ['fotoUrl', 'foto', 'Foto', 'Imagen', 'Fotografia']) || "",
    firmaUrl: findAndMap(f, T, "firmaUrl", ['firmaUrl', 'firma', 'Firma', 'Rubrica']) || "",
    grupos: findAndMap(f, T, "grupos", ['grupos', 'Grupos', 'Comisiones', 'grupos_sindicales', 'Grupos y Comisiones', 'Integracion']) || "",
    last_login: findAndMap(f, T, "last_login", ['last_login', 'Último Acceso', 'ultimo_acceso', 'Last Login', 'Acceso']) || "",
    last_active: findAndMap(f, T, "last_active", ['last_active', 'actividad', 'Ultima Actividad', 'Last Active', 'Actividad']) || ""
  } as UserProfile;
};

let AIRTABLE_KEY = "";
let BASE_ID = "";

export const setAirtableConfig = (key: string, base: string) => {
  AIRTABLE_KEY = key.trim();
  BASE_ID = base.trim();
  localStorage.setItem('sitracounach_config', JSON.stringify({ airtableKey: AIRTABLE_KEY, baseId: BASE_ID }));
};

const getSavedConfig = () => {
  try {
    const saved = localStorage.getItem('sitracounach_config');
    if (saved) return JSON.parse(saved);
  } catch (e) { return null; }
  return null;
};

const getHeaders = () => {
  const config = getSavedConfig();
  return { Authorization: `Bearer ${AIRTABLE_KEY || config?.airtableKey}`, 'Content-Type': 'application/json' };
};

const getBaseId = () => BASE_ID || getSavedConfig()?.baseId;

const fetchAllPages = async (tableName: string, params: string = "") => {
  const base = getBaseId();
  if (!base) return [];
  let allRecords: any[] = [];
  let offset = "";
  const baseUrl = `https://api.airtable.com/v0/${base}/${tableName}`;
  try {
    do {
      const url = `${baseUrl}${params}${offset ? `${params.includes('?') ? '&' : '?'}offset=${offset}` : ""}`;
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) break;
      const data = await response.json();
      allRecords = [...allRecords, ...data.records];
      offset = data.offset;
    } while (offset);
    return allRecords;
  } catch (e) { return []; }
};

// --- ENTRENAMIENTO IA ---
export const fetchAIKnowledgeBase = async (): Promise<KnowledgeBaseItem[]> => {
  const records = await fetchAllPages("Entrenamiento_IA");
  const T = "Entrenamiento_IA";
  return records.map(r => ({
    id: r.id,
    titulo: findAndMap(r.fields, T, "titulo", ['titulo', 'Titulo', 'Nombre', 'Documento']) || "Sin título",
    contenido: findAndMap(r.fields, T, "contenido", ['contenido', 'Contenido', 'Texto', 'Detalle']) || "",
    referencia: findAndMap(r.fields, T, "referencia", ['referencia', 'Referencia', 'Oficio', 'Seccion', 'Ley']) || "",
    categoria: findAndMap(r.fields, T, "categoria", ['categoria', 'Categoria', 'Tipo']) || "General",
    fechaDocumento: findAndMap(r.fields, T, "fechaDocumento", ['fechaDocumento', 'fecha', 'Fecha']) || r.createdTime,
    activo: r.fields.activo !== undefined ? r.fields.activo : true
  }));
};

export const createOrUpdateAIKnowledge = async (item: Partial<KnowledgeBaseItem>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const isUpdate = !!item.id;
  const fields: any = {
    "titulo": item.titulo,
    "contenido": item.contenido,
    "referencia": item.referencia,
    "categoria": item.categoria,
    "fechaDocumento": item.fechaDocumento,
    "activo": item.activo ?? true
  };
  const url = `https://api.airtable.com/v0/${base}/Entrenamiento_IA${isUpdate ? `/${item.id}` : ''}`;
  const response = await fetch(url, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const deleteAIKnowledge = async (id: string): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const response = await fetch(`https://api.airtable.com/v0/${base}/Entrenamiento_IA/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return response.ok;
};

// --- AFILIADOS ---
export const findUserByCredentials = async (identifier: string): Promise<UserProfile | null> => {
  const base = getBaseId();
  if (!base) return null;
  const id = identifier.trim().toLowerCase();
  const formula = `OR(LOWER({nickname} & "") = '${id}', LOWER({Correo_unach} & "") = '${id}', LOWER({Plaza} & "") = '${id}')`;
  try {
    const url = `https://api.airtable.com/v0/${base}/Afiliados?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
    const response = await fetch(url, { headers: getHeaders() });
    if (response.ok) {
      const data = await response.json();
      if (data.records?.length > 0) return mapAirtableToProfile(data.records[0]);
    }
    const all = await fetchAffiliatesFromAirtable();
    return all.find(u => u.nickname?.toLowerCase() === id || u.email_unach?.toLowerCase() === id || u.employeeId === id) || null;
  } catch (e) { return null; }
};

export const fetchAffiliatesFromAirtable = async (): Promise<UserProfile[]> => {
  const records = await fetchAllPages("Afiliados");
  return records.map(mapAirtableToProfile);
};

export const createAffiliateInAirtable = async (profile: Partial<UserProfile>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const T = "Afiliados";
  try {
    const fields: any = {};
    const map = (key: string, val: any) => {
      const realKey = FIELD_CACHE[T]?.[key] || key;
      fields[realKey] = val;
    };
    if (profile.fullName !== undefined) map("fullName", profile.fullName);
    if (profile.employeeId !== undefined) map("employeeId", profile.employeeId);
    if (profile.rfc !== undefined) map("rfc", profile.rfc);
    if (profile.direccion !== undefined) map("direccion", profile.direccion);
    if (profile.email_unach !== undefined) map("email_unach", profile.email_unach);
    if (profile.nickname !== undefined) map("nickname", profile.nickname);
    if (profile.password_hash !== undefined) map("password_hash", profile.password_hash);
    if (profile.status !== undefined) map("status", profile.status);
    if (profile.role !== undefined) map("role", profile.role);
    if (profile.fotoUrl !== undefined) map("fotoUrl", profile.fotoUrl);
    if (profile.firmaUrl !== undefined) map("firmaUrl", profile.firmaUrl);
    if (profile.dependencia !== undefined) map("dependencia", profile.dependencia);
    if (profile.grupos !== undefined) map("grupos", profile.grupos);
    const response = await fetch(`https://api.airtable.com/v0/${base}/Afiliados`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fields, typecast: true })
    });
    return response.ok;
  } catch (error) { return false; }
};

export const updateAffiliateInAirtable = async (id: string, profile: Partial<UserProfile>): Promise<boolean> => {
  const base = getBaseId();
  if (!base || !id) return false;
  const T = "Afiliados";
  try {
    const fields: any = {};
    const map = (key: string, val: any) => {
      const realKey = FIELD_CACHE[T]?.[key] || key;
      fields[realKey] = val;
    };
    if (profile.fullName !== undefined) map("fullName", profile.fullName);
    if (profile.employeeId !== undefined) map("employeeId", profile.employeeId);
    if (profile.rfc !== undefined) map("rfc", profile.rfc);
    if (profile.direccion !== undefined) map("direccion", profile.direccion);
    if (profile.email_unach !== undefined) map("email_unach", profile.email_unach);
    if (profile.nickname !== undefined) map("nickname", profile.nickname);
    if (profile.password_hash !== undefined) map("password_hash", profile.password_hash);
    if (profile.status !== undefined) map("status", profile.status);
    if (profile.role !== undefined) map("role", profile.role);
    if (profile.fotoUrl !== undefined) map("fotoUrl", profile.fotoUrl);
    if (profile.firmaUrl !== undefined) map("firmaUrl", profile.firmaUrl);
    if (profile.dependencia !== undefined) map("dependencia", profile.dependencia);
    if (profile.grupos !== undefined) map("grupos", profile.grupos);
    if (profile.last_login !== undefined) map("last_login", profile.last_login);
    if (profile.last_active !== undefined) map("last_active", profile.last_active);
    const response = await fetch(`https://api.airtable.com/v0/${base}/Afiliados/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ fields, typecast: true })
    });
    return response.ok;
  } catch (error) { return false; }
};

// --- GRUPOS ---
export const fetchGroupsFromAirtable = async (): Promise<UserGroup[]> => {
  const records = await fetchAllPages("Grupos");
  const T = "Grupos";
  return records.map((r: any) => {
    const f = r.fields;
    const membersData = findAndMap(f, T, "Miembros", ['Miembros', 'Integrantes', 'Afiliados', 'Socios', 'miembros', 'Agremiados']) || [];
    return {
      id: r.id,
      name: findAndMap(f, T, "Nombre", ['Nombre', 'nombre', 'name', 'Grupo']) || "Sin nombre",
      description: findAndMap(f, T, "Descripcion", ['Descripcion', 'descripcion', 'description', 'Detalle']) || "",
      type: findAndMap(f, T, "Tipo", ['Tipo', 'tipo', 'type', 'Categoria']) || GroupType.PERMANENTE,
      memberIds: Array.isArray(membersData) ? membersData : [],
      createdAt: r.createdTime
    };
  });
};

export const createOrUpdateGroup = async (group: Partial<UserGroup>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const isUpdate = !!group.id;
  const T = "Grupos";
  try {
    const fields: any = {};
    const map = (key: string, val: any) => {
      const realKey = FIELD_CACHE[T]?.[key] || key;
      fields[realKey] = val;
    };
    if (group.name !== undefined) map("Nombre", group.name);
    if (group.description !== undefined) map("Descripcion", group.description);
    if (group.type !== undefined) map("Tipo", group.type);
    if (group.memberIds !== undefined) map("Miembros", group.memberIds);
    const url = `https://api.airtable.com/v0/${base}/Grupos${isUpdate ? `/${group.id}` : ''}`;
    const response = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fields, typecast: true })
    });
    return response.ok;
  } catch (error) { return false; }
};

export const deleteGroupFromAirtable = async (id: string): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  try {
    const response = await fetch(`https://api.airtable.com/v0/${base}/Grupos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  } catch (error) { return false; }
};

// --- EVENTOS ---
export const fetchEventsFromAirtable = async (): Promise<LaborEvent[]> => {
  const records = await fetchAllPages("Eventos");
  const T = "Eventos";
  return records.map((r: any) => {
    const f = r.fields;
    let asistentesRaw = findAndMap(f, T, "registrados_ids", ['registrados_ids', 'Asistentes', 'Confirmados', 'Participantes', 'Inscritos', 'asistentes', 'Registrados', 'Afiliados']) || [];
    let finalIds: string[] = [];
    if (Array.isArray(asistentesRaw)) {
      finalIds = asistentesRaw;
    } else if (typeof asistentesRaw === 'string') {
      try {
        const parsed = JSON.parse(asistentesRaw);
        if (Array.isArray(parsed)) finalIds = parsed;
      } catch (e) {
        if (asistentesRaw.includes('rec')) {
          finalIds = asistentesRaw.split(',').map(s => s.trim());
        }
      }
    }
    return {
      id: r.id,
      nombre: findAndMap(f, T, "nombre", ['nombre', 'Nombre', 'Evento', 'titulo', 'Actividad']) || "Evento",
      fecha: findAndMap(f, T, "fecha", ['fecha', 'Fecha', 'Date', 'Dia']) || "",
      fechaCierre: findAndMap(f, T, "fecha_cierre", ['fecha_cierre', 'Cierre', 'Cierre de Registro', 'Limite']) || "",
      lugar: findAndMap(f, T, "lugar", ['lugar', 'Lugar', 'Ubicación', 'Sede']) || "",
      descripcion: findAndMap(f, T, "descripcion", ['descripcion', 'Descripción', 'Resumen', 'Informacion']) || "",
      estatusRegistro: findAndMap(f, T, "estatus_registro", ['estatus_registro', 'estatus', 'Situación', 'Estatus', 'Registro']) || "Abierto",
      registradosIds: finalIds
    };
  });
};

export const createOrUpdateEvent = async (event: Partial<LaborEvent>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const isUpdate = !!event.id;
  const T = "Eventos";
  try {
    const fields: any = {};
    const map = (key: string, val: any) => {
      const realKey = FIELD_CACHE[T]?.[key] || key;
      fields[realKey] = val;
    };
    if (event.nombre) map("nombre", event.nombre);
    if (event.fecha) map("fecha", event.fecha);
    if (event.fechaCierre) map("fecha_cierre", event.fechaCierre);
    if (event.lugar) map("lugar", event.lugar);
    if (event.descripcion !== undefined) map("descripcion", event.descripcion);
    if (event.estatusRegistro) map("estatus_registro", event.estatusRegistro);
    if (event.registradosIds) {
      const realKey = FIELD_CACHE[T]?.["registrados_ids"] || "registrados_ids";
      fields[realKey] = event.registradosIds;
    }
    const url = `https://api.airtable.com/v0/${base}/Eventos${isUpdate ? `/${event.id}` : ''}`;
    const response = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ fields, typecast: true })
    });
    return response.ok;
  } catch (error) { return false; }
};

export const toggleEventRegistration = async (eventId: string, profileId: string, currentRegistrados: string[]): Promise<boolean> => {
  const isRegistered = currentRegistrados.includes(profileId);
  const newRegistrados = isRegistered ? currentRegistrados.filter(id => id !== profileId) : [...currentRegistrados, profileId];
  return createOrUpdateEvent({ id: eventId, registradosIds: newRegistrados });
};

export const fetchAllPayments = async (): Promise<PaymentRecord[]> => {
  const records = await fetchAllPages("Pagos");
  return records.map((r: any) => ({
    id: r.id,
    afiliadoId: Array.isArray(r.fields.Afiliado) ? r.fields.Afiliado[0] : "",
    monto: r.fields.Monto || 0,
    mes: r.fields.Mes_Periodo || "",
    año: r.fields.Año_Periodo || 0,
    fechaDeposito: r.fields.Fecha_Deposito || "",
    metodo: r.fields.Metodo_Pago || "Transferencia",
    referencia: r.fields.Referencia_Bancaria || "",
    estatus: r.fields.Estatus_Legal || "Pendiente",
    notas: r.fields.notas || "",
    adminEditor: r.fields.Admin_Editor || "",
    comprobanteUrl: r.fields.comprobanteUrl || "",
    createdAt: r.createdTime
  }));
};

export const createPaymentInAirtable = async (payment: Partial<PaymentRecord>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const fields = {
    "Afiliado": [payment.afiliadoId],
    "Monto": payment.monto,
    "Mes_Periodo": payment.mes,
    "Año_Periodo": payment.año,
    "Fecha_Deposito": payment.fechaDeposito,
    "Metodo_Pago": payment.metodo,
    "Referencia_Bancaria": payment.referencia || "",
    "Estatus_Legal": payment.estatus || "Pendiente",
    "Admin_Editor": payment.adminEditor || "Sistema",
    "notas": payment.notas || "",
    "comprobanteUrl": payment.comprobanteUrl || ""
  };
  const response = await fetch(`https://api.airtable.com/v0/${base}/Pagos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const updatePaymentInAirtable = async (id: string, payment: Partial<PaymentRecord>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const fields: any = {};
  if (payment.estatus) fields["Estatus_Legal"] = payment.estatus;
  if (payment.notas) fields["notas"] = payment.notas;
  const response = await fetch(`https://api.airtable.com/v0/${base}/Pagos/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const fetchPaymentsForUser = async (employeeId: string): Promise<MonthlyDue[]> => {
  const base = getBaseId();
  if (!base) return [];
  const formula = `OR({Plaza} = '${employeeId}', {employeeId} = '${employeeId}')`;
  const response = await fetch(`https://api.airtable.com/v0/${base}/Pagos?filterByFormula=${encodeURIComponent(formula)}`, { headers: getHeaders() });
  if (!response.ok) return [];
  const data = await response.json();
  return data.records.map((r: any) => ({
    id: r.id,
    userId: employeeId,
    month: r.fields.Mes_Periodo || "",
    year: r.fields.Año_Periodo || 0,
    amount: r.fields.Monto || 0,
    status: r.fields.Estatus_Legal === 'Validado' ? 'Pagado' : 'Pendiente',
    paymentDate: r.fields.Fecha_Deposito || "",
    reference: r.fields.Referencia_Bancaria || "",
    comprobanteUrl: r.fields.comprobanteUrl || ""
  }));
};

export const fetchNewsFromAirtable = async (): Promise<NewsPost[]> => {
  const records = await fetchAllPages("Noticias", "?sort%5B0%5D%5Bfield%5D=fecha&sort%5B0%5D%5Bdirection%5D=desc");
  return records.map((r: any) => ({
    id: r.id,
    titulo: r.fields.titulo || "",
    contenido: r.fields.contenido || "",
    imagenUrl: r.fields.imagenUrl || "",
    autor: r.fields.autor || "SITRACOUNACH",
    fecha: r.fields.fecha || r.createdTime
  }));
};

export const createOrUpdateNews = async (news: Partial<NewsPost>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const isUpdate = !!news.id;
  const fields: any = {};
  if (news.titulo) fields["titulo"] = news.titulo;
  if (news.contenido) fields["contenido"] = news.contenido;
  if (news.imagenUrl) fields["imagenUrl"] = news.imagenUrl;
  if (news.autor) fields["autor"] = news.autor;
  if (news.fecha) fields["fecha"] = news.fecha;
  const response = await fetch(`https://api.airtable.com/v0/${base}/Noticias${isUpdate ? `/${news.id}` : ''}`, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const deleteNewsFromAirtable = async (id: string): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const response = await fetch(`https://api.airtable.com/v0/${base}/Noticias/${id}`, { method: 'DELETE', headers: getHeaders() });
  return response.ok;
};

export const fetchPollsFromAirtable = async (): Promise<Poll[]> => {
  const records = await fetchAllPages("Encuestas");
  return records.map((r: any) => ({
    id: r.id,
    pregunta: r.fields.Pregunta || "",
    descripcion: r.fields.Descripcion || "",
    opciones: r.fields.Opciones ? r.fields.Opciones.split(',').map((o: string) => o.trim()) : [],
    fechaInicio: r.fields.Fecha_Inicio || "",
    fechaFin: r.fields.Fecha_Fin || "",
    estatus: r.fields.Estatus || "Borrador",
    totalVotos: r.fields.Respuestas_Encuestas ? r.fields.Respuestas_Encuestas.length : 0
  }));
};

export const fetchAllPollResponses = async (): Promise<PollResponse[]> => {
  const records = await fetchAllPages("Respuestas_Encuestas");
  return records.map((r: any) => ({
    id: r.id,
    pollId: Array.isArray(r.fields.Encuesta) ? r.fields.Encuesta[0] : "",
    afiliadoId: Array.isArray(r.fields.Afiliado) ? r.fields.Afiliado[0] : "",
    voto: String(r.fields.Voto || "").trim()
  }));
};

export const submitPollVote = async (pollId: string, afiliadoId: string, voto: string): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const fields = { "Encuesta": [pollId], "Afiliado": [afiliadoId], "Voto": voto, "Fecha_Respuesta": new Date().toISOString() };
  const response = await fetch(`https://api.airtable.com/v0/${base}/Respuestas_Encuestas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const createOrUpdatePoll = async (poll: Partial<Poll>): Promise<boolean> => {
  const base = getBaseId();
  if (!base) return false;
  const isUpdate = !!poll.id;
  const fields = { Pregunta: poll.pregunta, Descripcion: poll.descripcion, Opciones: poll.opciones?.join(','), Fecha_Fin: poll.fechaFin, Estatus: poll.estatus };
  const response = await fetch(`https://api.airtable.com/v0/${base}/Encuestas${isUpdate ? `/${poll.id}` : ''}`, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fields, typecast: true })
  });
  return response.ok;
};

export const batchUpdateAffiliates = async (updates: { id: string, fields: Partial<UserProfile> }[]): Promise<boolean> => {
  const base = getBaseId();
  if (!base || updates.length === 0) return false;
  const T = "Afiliados";
  const chunks = [];
  for (let i = 0; i < updates.length; i += 10) chunks.push(updates.slice(i, i + 10));
  const results = await Promise.all(chunks.map(async (chunk) => {
    const mappedRecords = chunk.map(u => {
      const mappedFields: any = {};
      Object.entries(u.fields).forEach(([key, val]) => {
        const realKey = FIELD_CACHE[T]?.[key] || key;
        mappedFields[realKey] = val;
      });
      return { id: u.id, fields: mappedFields };
    });
    const response = await fetch(`https://api.airtable.com/v0/${base}/Afiliados`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ records: mappedRecords, typecast: true })
    });
    return response.ok;
  }));
  return results.every(res => res === true);
};
