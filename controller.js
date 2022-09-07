class Presentation {
    constructor(canvas, world, dimension) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.dimension = dimension;
        this.ctx = canvas.getContext('2d');
        this.x_ratio = this.width / dimension[0];
        this.y_ratio = this.height / dimension[1];
        this.world = world;

        this.preview_particle = {active: false, x: null, y: null};
    }

    #transform_model_coordinates(x) {
        return [x.a * this.x_ratio + this.width/2, this.height/2 - x.b * this.y_ratio];
    }

    transform_view_coordinates(x) {
        return new Vec2((x[0] - this.width/2) / this.x_ratio, (this.height/2 - x[1]) / this.y_ratio);
    }

    #draw_mass(x_m) {
        this.ctx.fillStyle = 'black';
        let coords = this.#transform_model_coordinates(x_m)
        let r = 4;
        this.ctx.fillRect(coords[0] - r, coords[1] - r, 2*r, 2*r);
    }

    #draw_particle(p) {
        this.ctx.fillStyle = 'rgb(242, 218, 0)';
        let coords = this.#transform_model_coordinates(p.x);
        let r = 4;
        this.ctx.beginPath()
        this.ctx.arc(coords[0], coords[1], r, 0, 2*Math.PI);
        this.ctx.fill()
    }

    #particle_in_view(p) {
        let coords = this.#transform_model_coordinates(p.x);
        return coords[0] >= 0 && coords[0] <= this.width && coords[1] >= 0 && coords[1] <= this.height;
    }

    #draw_preview_particle(x, y) {
        this.ctx.strokeStyle = 'green';
        this.ctx.beginPath();
        this.ctx.moveTo(x[0], x[1]);
        this.ctx.lineTo(y[0], y[1]);
        this.ctx.stroke();
    }

    draw() {
        // Delete particles not in view
        this.world.particles = this.world.particles.filter(this.#particle_in_view, this);

        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.world.masses.forEach(x_m => this.#draw_mass(x_m));
        this.world.particles.forEach(p => this.#draw_particle(p));
        
        if (this.preview_particle.active) {
            this.#draw_preview_particle(this.preview_particle.x, this.preview_particle.y);
        }
    }    
}

class Controller {
    constructor(canvas, mode_display) {
        this.canvas = canvas;
        this.creation_mode = 'mass';
        this.mouse_hold = false;

        // Add event listeners
        this.canvas.addEventListener('mousedown', e => this.mousedown(e));
        this.canvas.addEventListener('mousemove', e => this.mousemove(e));
        this.canvas.addEventListener('mouseup', e => this.mouseup(e));
        document.addEventListener('keypress', e => {
            if (e.key == ' ') {
                this.creation_mode = (this.creation_mode == 'mass') ? 'particle' : 'mass';
                mode_display.innerHTML = `Creation Mode: ${this.creation_mode}`;
            }
        });

        // Start simulation
        this.play()
    }

    play() {
        this.world = new World();
        this.presentation = new Presentation(document.getElementById('canvas'),
            this.world, [50, 50]);

        this.interval = setInterval(() => {
            this.presentation.draw();
            this.world.evolve(0.25);
        }, 40);
    }

    mousedown(e) {
        if (this.creation_mode == 'particle') {
            this.presentation.preview_particle.x = [e.offsetX, e.offsetY];
            this.presentation.preview_particle.y = [e.offsetX, e.offsetY];
            this.presentation.preview_particle.active = true;
        }

        this.mouse_hold = true;
    }

    mousemove(e) {
        if (this.mouse_hold && this.creation_mode == 'particle') {
            this.presentation.preview_particle.y = [e.offsetX, e.offsetY];
        }
    }

    mouseup(e) {
        if (this.creation_mode == 'particle') {
            this.create_particle(this.presentation.preview_particle.x, this.presentation.preview_particle.y);
            this.presentation.preview_particle.active = false;
        } else {
            this.create_mass([e.offsetX, e.offsetY]);
        }
        
        this.mouse_hold = false;
    }

    create_mass(canvas_x) {
        let x = this.presentation.transform_view_coordinates(canvas_x);
        this.world.add_mass(x);
    }

    create_particle(canvas_x, canvas_y) {
        let x = this.presentation.transform_view_coordinates(canvas_x);
        let y = this.presentation.transform_view_coordinates(canvas_y);
        let diff = y.minus(x);
        for (let i = 0; i < 10; i++) {
            let alpha = (Math.random() - 0.5) * Math.PI / 4;
            let cos = Math.cos(alpha);
            let sin = Math.sin(alpha);
            let p = new Vec2(diff.a * cos - diff.b * sin, diff.a * sin + diff.b * cos);

            this.world.add_particle(x, p);
        }
    }
}