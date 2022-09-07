function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

class World {
    constructor(gamma=100) {
        this.masses = [];
        this.particles = [];
        this.gamma = gamma;
    }

    add_mass(x) {
        this.masses.push(x);
    }
    
    add_particle(x, p) {
        this.particles.push({x: x, p: p});
    }

    grad_U(x) {
        // grad -1/|x - x_m| = grad |x - x_m| * 1/|x - x_m|^2
        // grad |x - x_m| = D(x - x_m) (x - x_m) / |x - x_m|
        // since D(x - x_m) = I, we have (x - x_m) / |x - x_m|^3      
        let vacuum_potential = x.mult(this.gamma / Math.max(x.norm2 * x.norm, 10));  
        return this.masses.reduce((sum, x_m) => {
            let y = x.minus(x_m);
            return sum.plus(y.mult(this.gamma / Math.max(y.norm2 * y.norm, 10)));
        }, vacuum_potential);
    }

    evolve(dt) {
        this.particles.forEach(p => { // Leapfrog method
            let x = p.x.plus(p.p.mult(dt/2));
            p.p = p.p.minus(this.grad_U(x).mult(dt));
            p.x = x.plus(p.p.mult(dt/2));
        });
    }

    randomize_momenta() {
        this.particles.forEach(p => {
            p.p = new Vec2(randn_bm(), randn_bm());
        });
    }
}

class Vec2 {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.norm2 = this.a**2 + this.b**2;
        this.norm = Math.sqrt(this.norm2);
    }

    plus(v) {
        return new Vec2(this.a + v.a, this.b + v.b);
    }

    minus(v) {
        return new Vec2(this.a - v.a, this.b - v.b);
    }

    mult(k) {
        return new Vec2(this.a * k, this.b * k)
    }
}
