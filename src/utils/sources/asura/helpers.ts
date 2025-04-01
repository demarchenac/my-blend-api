export function stringCompare(a: string, b: string) {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

export function dynamicSort<T>(property: keyof T, order: "asc" | "desc" = "asc") {
  return (a: T, b: T) => {
    let precedence = 0;

    if (typeof a[property] === "string" && typeof b[property] === "string")
      precedence = a[property].localeCompare(b[property]);

    return order === "desc" ? -precedence : precedence;
  };
}

export function array2chunks<T>(array: Array<T>, chunkSize: number) {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) =>
    array.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
}
