use crate::models::{Category, CategoryRow, Character};

pub fn xp_to_level(total_xp: i64) -> (i64, i64, i64) {
    let mut needed: i64 = 1000;
    let mut level: i64 = 1;
    let mut remaining = total_xp;
    while remaining >= needed {
        remaining -= needed;
        level += 1;
        needed = (needed as f64 * 1.15).round() as i64;
    }
    (level, remaining, needed)
}

pub fn cat_xp_to_level(total_xp: i64) -> (i64, i64, i64) {
    let mut needed: i64 = 250;
    let mut level: i64 = 1;
    let mut remaining = total_xp;
    while remaining >= needed {
        remaining -= needed;
        level += 1;
        needed = (needed as f64 * 1.20).round() as i64;
    }
    (level, remaining, needed)
}

pub fn determine_class(categories: &[Category]) -> String {
    let max_xp = categories.iter().map(|c| c.xp).max().unwrap_or(0);
    if max_xp == 0 {
        return "Awanturnik".to_string();
    }
    let leaders: Vec<_> = categories.iter().filter(|c| c.xp == max_xp).collect();
    if leaders.len() > 1 {
        return "Awanturnik".to_string();
    }
    match leaders[0].id.as_str() {
        "health"  => "Wojownik",
        "finance" => "Strateg",
        "habit"   => "Mnich",
        "learn"   => "Uczony",
        "work"    => "Rzemieślnik",
        "social"  => "Dyplomata",
        _         => "Awanturnik",
    }.to_string()
}

pub fn enrich_category(row: CategoryRow) -> Category {
    let (level, xp_in_level, xp_to_next) = cat_xp_to_level(row.xp);
    Category {
        id: row.id,
        element: row.element,
        rune: row.rune,
        stat: row.stat,
        xp: row.xp,
        level,
        xp_in_level,
        xp_to_next,
    }
}

pub fn build_character(
    id: i64,
    name: String,
    total_xp: i64,
    cat_rows: Vec<CategoryRow>,
) -> Character {
    let categories: Vec<Category> = cat_rows.into_iter().map(enrich_category).collect();
    let class = determine_class(&categories);
    let (level, xp_in_level, xp_to_next) = xp_to_level(total_xp);
    Character { id, name, class, total_xp, level, xp_in_level, xp_to_next, categories }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn level_1_at_zero_xp() {
        let (level, xp_in, xp_next) = xp_to_level(0);
        assert_eq!(level, 1);
        assert_eq!(xp_in, 0);
        assert_eq!(xp_next, 1000);
    }

    #[test]
    fn level_2_at_1000_xp() {
        let (level, xp_in, _) = xp_to_level(1000);
        assert_eq!(level, 2);
        assert_eq!(xp_in, 0);
    }

    #[test]
    fn level_2_partial_xp() {
        let (level, xp_in, xp_next) = xp_to_level(1200);
        assert_eq!(level, 2);
        assert_eq!(xp_in, 200);
        assert_eq!(xp_next, 1150);
    }

    #[test]
    fn cat_level_2_at_250() {
        let (level, xp_in, _) = cat_xp_to_level(250);
        assert_eq!(level, 2);
        assert_eq!(xp_in, 0);
    }

    #[test]
    fn class_determined_by_max_xp() {
        let cats: Vec<Category> = [
            ("health", 500i64), ("finance", 100), ("habit", 0),
            ("learn", 0), ("work", 0), ("social", 0),
        ].iter().map(|(id, xp)| Category {
            id: id.to_string(), element: String::new(), rune: String::new(),
            stat: String::new(), xp: *xp, level: 1, xp_in_level: 0, xp_to_next: 250,
        }).collect();
        assert_eq!(determine_class(&cats), "Wojownik");
    }

    #[test]
    fn class_awanturnik_when_tied() {
        let cats: Vec<Category> = ["health","finance","habit","learn","work","social"]
            .iter().map(|id| Category {
                id: id.to_string(), element: String::new(), rune: String::new(),
                stat: String::new(), xp: 100, level: 1, xp_in_level: 0, xp_to_next: 250,
            }).collect();
        assert_eq!(determine_class(&cats), "Awanturnik");
    }
}
