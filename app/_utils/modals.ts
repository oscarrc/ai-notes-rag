export const showModal = (name: string) => {
  if (!document) return;

  const modal = document.getElementById(name) as HTMLDialogElement;
  if (!modal) return;

  modal.showModal();
};
