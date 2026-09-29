//Define las operaciones del repositorio de notificaciones
class IRepositorioNotificacion {
    async save() {
        throw new Error('Método save() no implementado');
    }

    async findById() {
        throw new Error('Método findById() no implementado');
    }

    async findByUsuario() {
        throw new Error('Método findByUsuario() no implementado');
    }

    async findAll() {
        throw new Error('Método findAll() no implementado');
    }

    async update() {
        throw new Error('Método update() no implementado');
    }
}

module.exports = IRepositorioNotificacion;
