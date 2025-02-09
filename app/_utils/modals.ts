export const showModal = (name: string) => {
    const modal = document.getElementById(name) as HTMLDialogElement;

    if(!modal) return;
    modal.showModal();
}