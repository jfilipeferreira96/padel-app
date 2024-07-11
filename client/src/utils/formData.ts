export function addToFormData(obj: any, formData: FormData, parentKey = "") {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];
      if (parentKey && !(value instanceof File)) {
        key = `${parentKey}[${key}]`;
      }
      if (value instanceof File) {
        const extendedFile = new File([value], `${value.name}`, { type: value.type, lastModified: value.lastModified });
        formData.append("files", extendedFile);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && !(item instanceof File)) {
            addToFormData(item, formData, `${key}[${index}]`);
          } else {
            formData.append(`${key}[${index}]`, item);
          }
        });
      } else if (typeof value === "object" && !(value instanceof File)) {
        addToFormData(value, formData, key);
      } else {
        formData.append(key, value);
      }
    }
  }
}
