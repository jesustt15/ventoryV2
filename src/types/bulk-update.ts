export type BulkResultItem = {
  serial: string;
  /** Número de fila en el Excel (encabezado = 1). */
  excelRow?: number;
  found: boolean;
  updated: boolean;
  message?: string;
  warning?: string;
  usuarioExcel?: string | null;
  usuarioActual?: string | null;
  usuarioExiste?: boolean;
};

export type BulkUpdateResult = {
  summary: {
    totalRows: number;
    totalSerialesUnicos: number;
    found: number;
    updated: number;
    /** Encontrados en BD pero sin campos a actualizar. */
    unchanged?: number;
    created?: number;
    /** Seriales distintos no encontrados en BD. */
    notFound: number;
    /** Filas del Excel cuyo serial no se resolvió (puede ser > notFound si el mismo serial falla en varias filas). */
    notFoundRows?: number;
    serialesFaltantes: string[];
    usuariosNoEncontrados: number;
    incongruenciasUsuarios: number;
    marcasCreadas?: number;
    modelosCreados?: number;
  };
  results: BulkResultItem[];
};
