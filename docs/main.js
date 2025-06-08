async function loadJson() {
  const response = await fetch('output.json');
  const data = await response.json();

  const softwareSystems = data.model.softwareSystems;
  const containerViewsDiv = document.getElementById("container-views");

  const containerMap = new Map();
  const elementMap = new Map();

  // Map containers
  for (const system of softwareSystems) {
    for (const container of system.containers || []) {
      containerMap.set(container.id, {
        name: container.name,
        description: container.description,
        imageId: container.properties?.["structurizr.dsl.identifier"] || null
      });
    }
  }

  // Map people
  for (const person of data.model.people || []) {
    elementMap.set(person.id, {
      name: person.name,
      description: person.description,
      imageId: person.properties?.["structurizr.dsl.identifier"] || null
    });
  }

  // Map software systems
  for (const system of softwareSystems) {
    elementMap.set(system.id, {
      name: system.name,
      description: system.description,
      imageId: system.properties?.["structurizr.dsl.identifier"] || null
    });
  }

  const viewTypes = [
    { key: "systemLandscapeViews", label: "System Landscape", elementsMap: elementMap },
    { key: "systemContextViews", label: "System Context", elementsMap: elementMap },
    { key: "containerViews", label: "Container View", elementsMap: containerMap }
  ];


  for (const viewType of viewTypes) {
    const views = data.views[viewType.key] || [];

    for (const view of views) {
      const system = view.softwareSystemId
        ? softwareSystems.find(s => s.id === view.softwareSystemId)
        : null;

      const systemName = system?.name || "";

      const viewSection = document.createElement("details");
      viewSection.className = "view";
      viewSection.open = true;

      const summary = document.createElement("summary");
      summary.innerHTML = `<strong>[${viewType.label}] ${systemName} ${view.key}</strong>`;
      viewSection.appendChild(summary);

      const viewDescription = document.createElement("p");
      viewDescription.textContent = view.description || "";
      viewSection.appendChild(viewDescription);

      // Show the full SVG for the view
      const viewImage = document.createElement("img");
      const viewImagePath = `images/structurizr-${view.key}.svg`;

      viewImage.src = viewImagePath;
      viewImage.alt = `Diagram for view: ${view.key}`;
      viewImage.onerror = () => {
        console.warn(`View image not found: ${viewImagePath}`);
        viewImage.src = 'images/placeholder.jpg';
      };
      viewImage.style.marginBottom = '1em';
      viewImage.style.maxWidth = '100%';
      viewSection.appendChild(viewImage);

      // Metadata display only — no image per element
      for (const el of view.elements) {
        const element = viewType.elementsMap.get(el.id);
        if (!element) continue;

        const elementDiv = document.createElement("div");
        elementDiv.className = "element";

        const title = document.createElement("strong");
        title.textContent = element.name;

        const imageIdNote = document.createElement("small");
        imageIdNote.innerHTML = `<em>${element.imageId || "No ID"}</em><br/>`;

        const description = document.createElement("div");
        description.textContent = element.description || "";

        elementDiv.appendChild(title);
        elementDiv.appendChild(imageIdNote);
        elementDiv.appendChild(description);
        viewSection.appendChild(elementDiv);
      }

      // Build a map of relationships by ID
      const relationshipMap = new Map();
      for (const rel of data.model.relationships || []) {
        relationshipMap.set(rel.id, rel);
      }

      // Display relationships for the view
      if (view.relationships?.length > 0) {
        const relSection = document.createElement("div");
        relSection.className = "relationships";
        const heading = document.createElement("h4");
        heading.textContent = "Relationships";
        relSection.appendChild(heading);

        for (const relRef of view.relationships) {
          const rel = relationshipMap.get(relRef.id);
          if (!rel) continue;

          const source = viewType.elementsMap.get(rel.sourceId);
          const dest = viewType.elementsMap.get(rel.destinationId);
          const description = rel.description || "";
          const tech = rel.technology ? ` (${rel.technology})` : "";

          const relText = document.createElement("div");
          relText.textContent = `${source?.name || rel.sourceId} → ${dest?.name || rel.destinationId}: ${description}${tech}`;
          relSection.appendChild(relText);
        }

        viewSection.appendChild(relSection);
      }


      containerViewsDiv.appendChild(viewSection);
    }
  }
}

loadJson();
